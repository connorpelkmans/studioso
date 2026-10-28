/* ===== module: 98-companion.js ===== */
/* Studyboard 1.11.0 */
(() => {
  const VB = 120, INK = "#2B2233";
  const DATA = typeof COMP_DATA !== "undefined" ? COMP_DATA : [];
  const GREET_KEY = "studyboard:comp:greeted";

  /* The rig format */
  const PIVOT_PARTS = ["tail", "wingL", "wingR", "armL", "armR", "earL", "earR", "top"];
  const STATIC_PARTS = ["back", "feet", "body", "head", "face", "hat"];
  const POSES = ["stand", "sit", "float"];
  const EYE_STYLES = ["dot", "round", "sparkle"];
  const MOUTH_STYLES = ["smile", "cat"];
  const MOUTH_STATES = ["neutral", "smile", "open", "sleepy"];
  const LINE_KINDS = {tap: 6, pet: 2, hello: 2, morning: 1, night: 1, focus: 2, done: 2, task: 3, break: 1};
  const ANCHORS = ["top", "neck", "chest", "back", "hands"];
  // Signature idles
  const IDLES = {
    tailSwish: "tail", earTwitch: "earL|earR", wingFlutter: "wingL,wingR|armL,armR", finWiggle: "armL|armR|tail|wingL|wingR",
    wave: "armL|armR", headTilt: "head", topBob: "top", bounce: "", hop: "", spin: "", sway: "", waddle: "", sparkle: ""
  };
  /* Props (accessories) */
  const ACC = [
    {id: "scarf", name: "Cozy Scarf", hours: 1, free: true, paths: [["ontime", 3], ["checkins", 3]]},
    {id: "hat", name: "Tiny Hat", hours: 5, free: true, paths: [["streak", 3], ["notes", 3]]},
    {id: "bowtie", name: "Party Bow Tie", free: true, paths: [["ontime", 10], ["early", 4], ["checkins", 7]]},
    {id: "glasses", name: "Round Glasses", hours: 15, paths: [["cards", 150], ["quizzes", 3]]},
    {id: "medal", name: "Champion Medal", paths: [["quizzes", 6], ["cards", 400], ["prep", 6]]},
    {id: "cape", name: "Hero Cape", paths: [["streak", 7], ["ontime", 50], ["checkins", 21]]},
    {id: "star", name: "Star Badge", hours: 60, paths: [["stickers", 15], ["streak", 14], ["focusWeeks", 4]]},
    {id: "beanie", name: "Festive Beanie", paths: [["festive", 1]]},
    {id: "cap", name: "Graduation Cap", hours: 100, paths: [["prep", 12], ["ontime", 100]]},
    {id: "crown", name: "Little Crown", paths: [["streak", 30], ["stickers", 30], ["hours", 150]]}
  ];
  const GENERIC = {
    tap: ["Hi hi! I'm so happy you're here!", "You're doing amazing today!", "One step at a time, and you're crushing it!", "I believe in you so much!", "Yay, it's you! Hello!", "Let's keep this streak of awesome going!"],
    pet: ["Hehe, that tickles! Again!", "You're the best, you know that?"], hello: ["You're back! Yay! Ready when you are!", "Hello hello! I missed you!"],
    morning: ["Good morning! Let's make today great!"], night: ["Late one tonight! Rest soon, okay?"], focus: ["Let's focus together! We've got this!", "Studying right beside you! Go go go!"],
    done: ["Session done! That was AMAZING!", "You did it! So proud of you!"], task: ["WOO! Nice work!", "Yes! One more done!", "Look at you go! Checked off!"], break: ["Stretch time! Big happy stretch!"]
  };

  const num = v => typeof v === "number" && isFinite(v);
  const pt = v => Array.isArray(v) && v.length >= 2 && num(v[0]) && num(v[1]);
  const partSvg = v => typeof v === "string" ? v : v && typeof v.svg === "string" ? v.svg : "";
  function norm(raw, theme, slot){
    if (!raw || typeof raw !== "object" || !raw.id) return null;
    const c = Object.assign({}, raw);
    c.theme = theme; c.slot = slot; c.raw = raw;
    c.pose = POSES.includes(c.pose) ? c.pose : "stand";
    c.size = num(c.size) ? Math.max(0.8, Math.min(1.15, c.size)) : 1;
    c.parts = Object.assign({}, c.parts);
    c.idle = (Array.isArray(c.idle) ? c.idle : []).filter(n => IDLES[n] != null);
    if (!c.idle.length) c.idle = ["bounce"];
    c.cheer = IDLES[c.cheer] != null ? c.cheer : "hop";
    c.eyes = Object.assign({lx: 48, rx: 72, y: 60, r: 5, style: "dot", color: INK}, c.eyes);
    c.mouth = Object.assign({x: 60, y: 70, w: 4, color: INK, style: "smile"}, c.mouth);
    c.anchors = Object.assign({}, c.anchors);
    c.lines = Object.assign({}, c.lines);
    c.neck = pt(c.neck) ? c.neck : [60, 80];
    return c;
  }
  const REG = {}, BYID = {};
  // How many companions a theme offers
  const SET_SIZE = th => th === "plain" ? 6 : 3;
  DATA.forEach(t => {
    if (!t || !t.theme || REG[t.theme]) return;
    const list = (Array.isArray(t.companions) ? t.companions : []).slice(0, SET_SIZE(t.theme)).map((c, i) => norm(c, t.theme, i)).filter(Boolean);
    if (!list.length) return;
    REG[t.theme] = {theme: t.theme, spot: t.spot, list};
    list.forEach(c => { if (!BYID[c.id]) BYID[c.id] = c; });
  });
  // Extra companions (98-comp-extra.js)
  const EXTRA = (typeof COMP_EXTRA !== "undefined" && Array.isArray(COMP_EXTRA) ? COMP_EXTRA : []).map((c, i) => norm(c, "extra", i)).filter(c => c && !BYID[c.id]);
  EXTRA.forEach(c => { BYID[c.id] = c; });
  const extrasOn = () => { try { return EXTRA.length > 0 && !!(window.SBThemes && SBThemes.all()); } catch (e) { return false; } };
  /* ---------- Tiers: a companion has the tier of the theme it lives in (single source of truth: SKINS via themeTier) ----------
     Plain-color companions are free; every companion of a Pro theme is Pro. Registered in STYLE_LISTS so owns("comp", id) works
     like every other shop item (Pro, or owned/earned, or you own the companion's theme). Props (accessories) use their own free flag. */
  Object.keys(REG).forEach(th => REG[th].list.forEach(c => {
    if (STYLE_LISTS.comp.some(x => x.id === c.id)) return;
    STYLE_LISTS.comp.push({id: c.id, name: c.name, theme: th, get tier(){ return themeTier(th); }});
  }));
  ACC.forEach(a => { if (!STYLE_LISTS.prop.some(x => x.id === a.id)) STYLE_LISTS.prop.push({id: a.id, name: a.name, get tier(){ return a.free ? "free" : "pro"; }}); });

  /* ---------- Drawing ---------- */
  const OUT = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const f1 = n => Math.round(n * 100) / 100;
  function eyeOpen(e, x){
    const r = e.r, c = e.color || INK;
    if (e.style === "round") {
      return `<g class="cp-look"><g class="cp-pupil"><ellipse cx="${x}" cy="${e.y}" rx="${f1(r * 0.88)}" ry="${r}" fill="${c}" stroke="#fff" stroke-opacity=".75" stroke-width="${f1(Math.max(0.8, r * 0.14))}"/><circle cx="${f1(x + r * 0.3)}" cy="${f1(e.y - r * 0.38)}" r="${f1(r * 0.38)}" fill="#fff"/><circle cx="${f1(x - r * 0.32)}" cy="${f1(e.y + r * 0.4)}" r="${f1(r * 0.18)}" fill="#fff"/><circle cx="${f1(x + r * 0.42)}" cy="${f1(e.y + r * 0.3)}" r="${f1(r * 0.09)}" fill="#fff"/></g></g>`;
    }
    const hl = e.style === "sparkle" ? `<circle cx="${f1(x + r * 0.3)}" cy="${f1(e.y - r * 0.38)}" r="${f1(r * 0.4)}" fill="#fff"/><circle cx="${f1(x - r * 0.32)}" cy="${f1(e.y + r * 0.4)}" r="${f1(r * 0.2)}" fill="#fff"/><circle cx="${f1(x + r * 0.42)}" cy="${f1(e.y + r * 0.3)}" r="${f1(r * 0.1)}" fill="#fff"/>`
      : `<circle cx="${f1(x + r * 0.3)}" cy="${f1(e.y - r * 0.36)}" r="${f1(r * 0.34)}" fill="#fff"/><circle cx="${f1(x - r * 0.3)}" cy="${f1(e.y + r * 0.38)}" r="${f1(r * 0.15)}" fill="#fff"/>`;
    return `<g class="cp-look"><g class="cp-pupil"><ellipse cx="${x}" cy="${e.y}" rx="${f1(r * 0.86)}" ry="${r}" fill="${c}"/>${hl}</g></g>`;
  }
  function eyesSvg(e){
    const r = e.r, w = Math.max(2, f1(r * 0.5)), c = e.color || INK;
    const happy = x => `<path d="M${f1(x - r)} ${f1(e.y + r * 0.35)}Q${x} ${f1(e.y - r * 1.05)} ${f1(x + r)} ${f1(e.y + r * 0.35)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const sleepy = x => `<path d="M${f1(x - r)} ${f1(e.y - r * 0.05)}Q${x} ${f1(e.y + r * 0.95)} ${f1(x + r)} ${f1(e.y - r * 0.05)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const one = (x, s) => `<g class="cp-eye cp-eye${s}" style="transform-origin:${x}px ${e.y}px">${eyeOpen(e, x)}</g>`;
    return `<g class="cp-eyes">${one(e.lx, "L")}${one(e.rx, "R")}<g class="cp-e-happy">${happy(e.lx)}${happy(e.rx)}</g><g class="cp-e-sleepy">${sleepy(e.lx)}${sleepy(e.rx)}</g></g>`;
  }
  function mouthSvg(c){
    const m = c.mouth, cm = m.color || INK;
    if (c.mouths && MOUTH_STATES.every(s => typeof c.mouths[s] === "string")) return `<g class="cp-mouth">${MOUTH_STATES.map(s => `<g class="cp-m-${s}">${c.mouths[s]}</g>`).join("")}</g>`;
    const {x, y, w} = m, st = `fill="none" stroke="${cm}" stroke-width="${Math.max(2, f1(w * 0.55))}" stroke-linecap="round" stroke-linejoin="round"`;
    const neutral = m.style === "cat" ? `<path d="M${f1(x - w)} ${y}q${f1(w / 2)} ${f1(w * 0.75)} ${w} 0q${f1(w / 2)} ${f1(w * 0.75)} ${w} 0" ${st}/>` : `<path d="M${f1(x - w)} ${y}q${w} ${f1(w * 0.8)} ${f1(w * 2)} 0" ${st}/>`;
    const smile = m.style === "cat" ? `<path d="M${f1(x - w * 1.2)} ${f1(y - 0.5)}q${f1(w * 0.6)} ${f1(w * 1.1)} ${f1(w * 1.2)} 0q${f1(w * 0.6)} ${f1(w * 1.1)} ${f1(w * 1.2)} 0" ${st}/>` : `<path d="M${f1(x - w * 1.3)} ${f1(y - 1)}q${f1(w * 1.3)} ${f1(w * 1.35)} ${f1(w * 2.6)} 0" ${st}/>`;
    const open = `<path d="M${f1(x - w * 1.05)} ${f1(y - 1)}q${f1(w * 1.05)} ${f1(w * 2.4)} ${f1(w * 2.1)} 0z" fill="${cm}" stroke="${cm}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${f1(x - w * 0.55)} ${f1(y + w * 0.62)}q${f1(w * 0.55)} ${f1(-w * 0.55)} ${f1(w * 1.1)} 0q${f1(-w * 0.55)} ${f1(w * 0.45)} ${f1(-w * 1.1)} 0z" fill="#FF8FA8"/>`;
    const sleepy = `<ellipse cx="${x}" cy="${f1(y + 0.6)}" rx="${f1(w * 0.42)}" ry="${f1(w * 0.52)}" fill="${cm}"/>`;
    return `<g class="cp-mouth"><g class="cp-m-neutral">${neutral}</g><g class="cp-m-smile">${smile}</g><g class="cp-m-open">${open}</g><g class="cp-m-sleepy">${sleepy}</g></g>`;
  }
  function cheeksSvg(c){
    const k = c.cheeks; if (!k) return "";
    const col = k.color || "#FF8FA8", rx = k.w || 5, ry = k.h || 3.2;
    return `<g class="cp-cheeks"><ellipse cx="${k.lx}" cy="${k.y}" rx="${rx}" ry="${ry}" fill="${col}"/><ellipse cx="${k.rx}" cy="${k.y}" rx="${rx}" ry="${ry}" fill="${col}"/></g>`;
  }
  // Accessories, drawn around (0,0) at the anchor and scaled by the anchor's third number
  const at = (a, inner) => { if (!pt(a)) return ""; const s = num(a[2]) ? a[2] : 1, r = num(a[3]) ? a[3] : 0; return `<g transform="translate(${a[0]} ${a[1]})${r ? ` rotate(${r})` : ""}${s !== 1 ? ` scale(${s})` : ""}">${inner}</g>`; };
  const WEAR = `style="fill:var(--cp-wear,#5B7FD6)"`;
  const ACC_ART = {
    scarf: `<path d="M-21 -5Q0 2 21 -5Q25 0 21 5.5Q0 12 -21 5.5Q-25 0 -21 -5Z" ${WEAR} ${OUT(2.4)}/><path d="M-19 -1.5Q0 5 19 -1.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4L9 21L18 19.5L13 3Z" ${WEAR} ${OUT(2.4)}/><path d="M10.5 14.5L16 13.6" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/><path d="M10 21.4l-.4 2.6M13.4 20.8l-.2 2.6M16.6 20.2l.2 2.6" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.5" cy="4" r="4.4" ${WEAR} ${OUT(2.4)}/>`,
    hat: `<path d="M-15 1C-15.5 -14 -8 -20 0 -20S15.5 -14 15 1Z" ${WEAR} ${OUT(2.4)}/><path d="M-6 -16Q-10 -9 -10 -1M5 -17Q9 -9 9 -1" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="2" stroke-linecap="round"/><rect x="-17" y="-4" width="34" height="8.5" rx="4.2" ${WEAR} ${OUT(2.4)}/><rect x="-15" y="-2.4" width="30" height="5.2" rx="2.6" fill="#fff" opacity=".4"/><circle cx="0" cy="-21" r="5.4" fill="#FFF8F0" ${OUT(2.4)}/><circle cx="-1.6" cy="-22.6" r="1.6" fill="#fff"/>`,
    star: `<path d="M-5 5L-7 14L-3 12L-1 15L0 6ZM5 5L7 14L3 12L1 15L0 6Z" fill="#FF7A9C" ${OUT(1.6)}/><path d="M0 -8.2L2.4 -3.1L8 -2.5L3.8 1.3L5 6.8L0 4L-5 6.8L-3.8 1.3L-8 -2.5L-2.4 -3.1Z" ${WEAR} ${OUT(1.8)}/><path d="M-1.6 -3.2L0 -6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
    bowtie: `<path d="M0 0L-16 -9Q-20.5 0 -16 9Z" ${WEAR} ${OUT(2.4)}/><path d="M0 0L16 -9Q20.5 0 16 9Z" ${WEAR} ${OUT(2.4)}/><path d="M-13 -4.5L-6 -1.5M13 -4.5L6 -1.5" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/><rect x="-4.6" y="-5.4" width="9.2" height="10.8" rx="3.6" ${WEAR} ${OUT(2.4)}/><rect x="-2" y="-3.6" width="2.4" height="4" rx="1.2" fill="#fff" opacity=".5"/>`,
    cape: `<path d="M-14 -3Q0 3 14 -3L38 28Q28 34 19 30Q9.5 36 0 31Q-9.5 36 -19 30Q-28 34 -38 28Z" ${WEAR} ${OUT(2.4)}/><path d="M-8 4Q-12 16 -20 27M8 4Q12 16 20 27M0 8V28" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`,
    capeCollar: `<path d="M-14 -3Q0 3 14 -3V0.5Q0 6.5 -14 0.5Z" fill="#FFD35A" ${OUT(2)}/><circle cx="0" cy="4" r="3" fill="#FFF8F0" ${OUT(1.6)}/><circle cx="-0.8" cy="3.2" r="0.9" fill="#fff"/>`,
    medal: `<path d="M-9 -11L-1.5 5H3.5L-4 -11Z" fill="#5A95FF" ${OUT(1.6)}/><path d="M9 -11L1.5 5H-3.5L4 -11Z" fill="#FF7A9C" ${OUT(1.6)}/><circle cx="0" cy="10" r="8.6" ${WEAR} ${OUT(1.9)}/><circle cx="0" cy="10" r="5.6" fill="none" stroke="#E8A317" stroke-width="1.5"/><path d="M0 5.6L1.5 8.6L4.8 9.1L2.4 11.4L3 14.7L0 13.1L-3 14.7L-2.4 11.4L-4.8 9.1L-1.5 8.6Z" fill="#fff" opacity=".9"/><path d="M-5 6Q-3 3.6 0 3.4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".7"/>`,
    crown: `<path d="M-14 3L-17 -13L-8 -5.5L0 -17L8 -5.5L17 -13L14 3Z" ${WEAR} ${OUT(2.4)}/><rect x="-14.5" y="-1" width="29" height="7" rx="3" fill="#F2B63A" ${OUT(2.2)}/><circle cx="-17" cy="-14" r="2.7" fill="#FF7A9C" ${OUT(1.4)}/><circle cx="0" cy="-18.5" r="3" fill="#5A95FF" ${OUT(1.4)}/><circle cx="17" cy="-14" r="2.7" fill="#FF7A9C" ${OUT(1.4)}/><circle cx="-7" cy="2.6" r="1.5" fill="#fff"/><circle cx="0" cy="2.6" r="1.5" fill="#fff"/><circle cx="7" cy="2.6" r="1.5" fill="#fff"/><path d="M-9 -3L-12 -9" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`,
    beanie: `<path d="M-14.5 1C-16 -13 -9 -19 0 -19S16 -13 14.5 1Z" ${WEAR} ${OUT(2.4)}/><path d="M-8 -16Q-11 -9 -10.5 -1M-3 -18.2Q-4.6 -9 -4.2 -1M3 -18.2Q4.6 -9 4.2 -1M8 -16Q11 -9 10.5 -1" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.8" stroke-linecap="round"/><path d="M-13.6 -7.5Q0 -4 13.6 -7.5" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1.2 3.6"/><rect x="-17" y="-3.2" width="34" height="8.4" rx="4.2" fill="#FFF8F0" ${OUT(2.4)}/><path d="M-11.5 -1.6V3.6M-6 -1.6V3.6M-0.5 -1.6V3.6M5 -1.6V3.6M10.5 -1.6V3.6" stroke="#E9D6C4" stroke-width="1.6" stroke-linecap="round"/><circle cx="0" cy="-20.5" r="5.4" fill="#fff" ${OUT(2.4)}/><path d="M-2.8 -21.6Q-1 -24 1.8 -23.6" fill="none" stroke="#DCE7F7" stroke-width="1.5" stroke-linecap="round"/>`,
    cap: `<path d="M-12 -7V1.5Q0 7.5 12 1.5V-7Z" fill="#3A3450" ${OUT(2.4)}/><path d="M-23 -9.5L0 -18L23 -9.5L0 -1Z" ${WEAR} ${OUT(2.4)}/><path d="M-14 -11L0 -16" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/><path d="M0 -9.5L15 -7V3" fill="none" stroke="#F2C14E" stroke-width="2" stroke-linecap="round"/><path d="M13 2.5h4l1 6h-6Z" fill="#F2C14E" ${OUT(1.4)}/><circle cx="0" cy="-9.5" r="2" fill="#F2C14E" ${OUT(1.2)}/>`
  };
  /* Body regions: an item declares the one it covers */
  const ACC_SLOT = {hat: "head", cap: "head", crown: "head", beanie: "head", glasses: "face", scarf: "neck", bowtie: "neck", star: "chest", medal: "chest", cape: "back"};
  const slotOf = id => ACC_SLOT[id] || id;
  // The colour these were drawn in (the others follow the theme colour)
  const ACC_DEF = {star: "#FFD35A", medal: "#FFD35A", crown: "#FFD35A", beanie: "#E5484D", cap: "#4A4366", glasses: "#2B2233"};
  const TINTS = ["#E5484D", "#F2994A", "#FFD35A", "#4CB782", "#2FB5C9", "#5A95FF", "#8E6BE0", "#FF7A9C", "#8B6A4F", "#3A3450", "#FFFFFF"];
  const hexOk = v => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
  // "hat_scarf" (presence), an array or a single id, to a clean list with one item per region
  const wornList = w => {
    const seen = new Set(), out = [];
    (Array.isArray(w) ? w : typeof w === "string" ? w.split(/[_,]/) : []).forEach(id => { if (ACC_ART[id] || id === "glasses") { const k = slotOf(id); if (!seen.has(k)) { seen.add(k); out.push(id); } } });
    return out;
  };
  function glassesSvg(e, col){
    const R = Math.max(6.5, e.r * 1.8), y = e.y;
    const lens = col ? `fill="${col}" fill-opacity=".3" ${OUT(2.2).replace(INK, col)}` : `fill="#fff" fill-opacity=".16" ${OUT(2.2)}`;
    return `<g class="cp-acc cp-acc-glasses"><circle cx="${e.lx}" cy="${y}" r="${f1(R)}" ${lens}/><circle cx="${e.rx}" cy="${y}" r="${f1(R)}" ${lens}/><path d="M${f1(e.lx + R)} ${f1(y - 1)}Q${f1((e.lx + e.rx) / 2)} ${f1(y - 4.5)} ${f1(e.rx - R)} ${f1(y - 1)}" fill="none" ${col ? OUT(2.2).replace(INK, col) : OUT(2.2)}/><path d="M${f1(e.lx - R * 0.55)} ${f1(y - R * 0.5)}q${f1(R * 0.3)} ${f1(-R * 0.3)} ${f1(R * 0.7)} ${f1(-R * 0.35)}M${f1(e.rx - R * 0.55)} ${f1(y - R * 0.5)}q${f1(R * 0.3)} ${f1(-R * 0.3)} ${f1(R * 0.7)} ${f1(-R * 0.35)}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/></g>`;
  }
  const BOOK = `<path d="M0 0Q-9 -4.5 -18 -1.5V11Q-9 8 0 12.5Q9 8 18 11V-1.5Q9 -4.5 0 0Z" ${WEAR} ${OUT(2.2)}/><path d="M0 -1.6Q-7.5 -5.6 -15.5 -3.4V8.4Q-7.5 6 0 10Z" fill="#FFFDF7" ${OUT(1.6)}/><path d="M0 -1.6Q7.5 -5.6 15.5 -3.4V8.4Q7.5 6 0 10Z" fill="#FFFDF7" ${OUT(1.6)}/><path d="M-12.5 0.4q5 -1.4 9.5 0.6M-12.5 3.6q5 -1.4 9.5 0.6M3 1q5 -1.8 9.5 -0.6M3 4.2q5 -1.8 9.5 -0.6" fill="none" stroke="#B9B2C4" stroke-width="1.2" stroke-linecap="round"/><g class="cp-page" style="transform-origin:0px 0px"><path d="M0 -1.6Q7.5 -5.6 15.5 -3.4V8.4Q7.5 6 0 10Z" fill="#FFF7E6" ${OUT(1.4)}/></g>`;

  // Every drawing gets its own ids
  let uidN = 0;
  function uniqIds(svg){
    const ids = new Set(); svg.replace(/\sid="([^"]+)"/g, (m, id) => { ids.add(id); return m; });
    if (!ids.size) return svg;
    const suf = "-u" + (++uidN).toString(36);
    return svg.replace(/(\sid=")([^"]+)"/g, (m, a, id) => `${a}${id}${suf}"`)
      .replace(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g, (m, id) => ids.has(id) ? `url(#${id}${suf})` : m)
      .replace(/((?:xlink:)?href=")#([^"]+)"/g, (m, a, id) => ids.has(id) ? `${a}#${id}${suf}"` : m);
  }
  // The whole rig as SVG
  function rigSvg(c, o){
    o = o || {};
    const P = c.parts, A = c.anchors, rot = o.rot || {};
    const g = (name, pivot, extra) => {
      const v = P[name], inner = partSvg(v); if (!inner) return "";
      const pv = pivot || (v && pt(v.pivot) ? v.pivot : null);
      const r = rot[name] ? `rotate(${rot[name]}deg)` : "";
      const st = pv ? `transform-origin:${pv[0]}px ${pv[1]}px${r ? ";transform:" + r : ""}` : "";
      return `<g class="cp-p cp-${name}"${st ? ` style="${st}"` : ""}${extra || ""}>${inner}</g>`;
    };
    const worn = wornList(o.wear), tints = o.tint || cfg().tint || {};
    const na = pt(A.neck) ? A.neck : [60, c.neck[1], 1], capeA = [na[0], na[1], f1((num(na[2]) ? na[2] : 1) * 0.95)];
    const chestA = pt(A.chest) ? [A.chest[0], A.chest[1], f1((num(A.chest[2]) ? A.chest[2] : 1) * 1.3)] : A.chest;
    const tintOf = id => hexOk(tints[id]) ? tints[id] : "";
    const acc = (id, a) => worn.includes(id) ? `<g class="cp-acc cp-acc-${id}"${tintOf(id) || ACC_DEF[id] ? ` style="--cp-wear:${tintOf(id) || ACC_DEF[id]}"` : ""}>${at(a, ACC_ART[id])}</g>` : "";
    const capePart = art => worn.includes("cape") ? `<g class="cp-acc cp-acc-cape"${tintOf("cape") ? ` style="--cp-wear:${tintOf("cape")}"` : ""}>${at(capeA, art)}</g>` : "";
    const hasHead = !!partSvg(P.head);
    const headWorn = worn.some(id => slotOf(id) === "head");
    const headRot = rot.head ? `;transform:rotate(${rot.head}deg)` : "";
    const hands = pt(A.hands) ? A.hands : [60, 92];
    const face = `${g("face")}${cheeksSvg(c)}${eyesSvg(c.eyes)}${mouthSvg(c)}${worn.includes("glasses") ? glassesSvg(c.eyes, tintOf("glasses")) : ""}`;
    const svg = `<svg class="cp-svg" viewBox="0 0 ${VB} ${VB}" overflow="visible" aria-hidden="true" focusable="false" data-e="${o.eyes || "open"}" data-m="${o.mouth || "neutral"}" data-prop="${o.prop || ""}">
      <g class="cp-rig">${capePart(ACC_ART.cape)}${g("back")}${g("tail")}${g("wingL")}${g("wingR")}${hasHead ? "" : g("earL") + g("earR")}${g("feet")}
        <g class="cp-bodyg">${g("body")}${capePart(ACC_ART.capeCollar)}${acc("scarf", A.neck)}${acc("bowtie", A.neck)}${acc("star", chestA)}${acc("medal", chestA)}<g class="cp-prop">${at([hands[0], hands[1], num(hands[2]) ? hands[2] : 1], BOOK)}</g>${g("armL")}${g("armR")}</g>
        <g class="cp-headg"${hasHead ? ` style="transform-origin:${c.neck[0]}px ${c.neck[1]}px${headRot}"` : ""}>${hasHead ? g("earL") + g("earR") : ""}${g("head")}${face}${headWorn && c.hatTop ? "" : g("top")}${headWorn ? "" : g("hat")}${acc("hat", A.top)}${acc("cap", A.top)}${acc("crown", A.top)}${acc("beanie", A.top)}
          <g class="cp-zs"><text x="${f1((c.eyes.rx || 72) + 14)}" y="${f1((c.eyes.y || 60) - 12)}" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="11" fill="#8C87A8" stroke="#fff" stroke-width="3" paint-order="stroke">z</text><text x="${f1((c.eyes.rx || 72) + 22)}" y="${f1((c.eyes.y || 60) - 22)}" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="8" fill="#8C87A8" stroke="#fff" stroke-width="2.5" paint-order="stroke">z</text></g>
        </g>
      </g></svg>`;
    if (!o.look) return uniqIds(svg);
    const e = c.eyes, rr = 0.42 * e.r;
    return uniqIds(svg).replace(/class="cp-look"/g, `class="cp-look" style="transform:translate(${f1(o.look[0] * rr)}px,${f1(o.look[1] * rr)}px)"`);
  }

  /* ---------- Settings ---------- */
  const cfg = () => { const s = state.settings && state.settings.comp; return s && typeof s === "object" ? s : {}; };
  function setCfg(patch){
    const cur = cfg(), next = Object.assign({}, cur, patch);
    ["pick", "names", "wear", "earned", "tint"].forEach(k => { if (patch[k]) next[k] = Object.assign({}, cur[k], patch[k]); });
    state.settings = Object.assign({}, state.settings, {comp: next});
    saveSettings();
    if (patch.pick || patch.names || patch.wear || patch.tint || "on" in patch) setTimeout(() => {
      try { if (typeof faceSoon === "function") faceSoon(); } catch (e) {}
      try { scheduleRender(); } catch (e) {}
    }, 0);
  }
  const isOn = () => cfg().on !== false;
  const staysPut = () => cfg().still === true && !phone();
  const talkOn = () => cfg().talk !== false;
  const pro = () => { try { return typeof PLAN === "undefined" || !PLAN ? true : !!PLAN.isPro(); } catch (e) { return true; } };
  const paywall = () => { try { return !!(typeof PLAN !== "undefined" && PLAN && PLAN.paywall()); } catch (e) { return false; } };
  const skinId = () => document.documentElement.dataset.skin || effSkinId() || "classic";
  // A Your Photo theme (ph-...) can carry up to three companions picked from every theme
  const photoSet = id => {
    try {
      if (typeof id !== "string" || id.indexOf("ph-") !== 0 || !window.SBPHOTO || typeof SBPHOTO.recs !== "function") return null;
      const r = SBPHOTO.recs().find(x => x.id === id), list = (r && Array.isArray(r.comps) ? r.comps : []).map(cid => BYID[cid]).filter(Boolean).slice(0, 3);
      return list.length ? list : null;
    } catch (e) { return null; }
  };
  const themeKey = id => REG[id] ? id : photoSet(id) ? id : "plain";
  const setOf = id => { const base = photoSet(id) || (REG[themeKey(id)] || REG.plain || {list: []}).list; return extrasOn() ? base.concat(EXTRA) : base; };
  const compTier = c => itemTier("comp", c.id);
  // The plain set
  const EARN = {
    "plain-hilo": {n: 5, have: () => hours(), how: "Focus 5 hours", left: v => v < 1 ? Math.max(1, Math.round(v * 60)) + " min" : (Math.ceil(v * 10) / 10) + " h"},
    "plain-sum": {n: 20, have: () => earnedCounts().q, how: "Pass 20 quizzes (5+ questions, 80%+)", left: v => Math.ceil(v) + (Math.ceil(v) === 1 ? " quiz" : " quizzes")},
    "plain-packy": {n: 200, have: () => earnedCounts().c, how: "Review 200 flashcards", left: v => Math.ceil(v) + (Math.ceil(v) === 1 ? " card" : " cards")}
  };
  // What you've done
  function earnedCounts(){
    const e = (state.settings && state.settings.earn) || {}, decks = Object.values(state.decks || {});
    let q = 0, c = 0;
    try { decks.forEach(d => { (d.quizzes || []).forEach(r => { if (r && quizPasses(Number(r.score) || 0, Number(r.total) || 0)) q++; }); (d.cards || []).forEach(k => { c += Number(k && k.seen) || 0; }); }); } catch (err) {}
    return {q: Math.max(Number(e.q) || 0, q), c: Math.max(Number(e.c) || 0, c)};
  }
  const SET_ORDER = ["plain-mochi", "plain-inky", "plain-owl", "plain-hilo", "plain-sum", "plain-packy"];
  const focusLeft = c => !c || !(c.id in EARN) || pro() ? 0 : Math.max(0, EARN[c.id].n - EARN[c.id].have());
  const canComp = c => !!c && owns("comp", c.id) && !focusLeft(c);
  const canSlot = slot => canComp(setOf(skinId())[slot]);
  // APPLY-time gate
  function current(){
    const list = setOf(skinId()); if (!list.length) return null;
    const want = Number((cfg().pick || {})[themeKey(skinId())]) || 0;
    return list[want] && canComp(list[want]) ? list[want] : list.find(canComp) || null;
  }
  // A custom name is at most NAME_MAX characters (so it fits on the companion's card)
  const NAME_MAX = 12;
  const ownName = id => { const n = (cfg().names || {})[id]; return typeof n === "string" ? n.replace(/\s+/g, " ").trim().slice(0, NAME_MAX).trim() : ""; };
  const nameOf = c => ownName(c.id) || c.name;
  const hours = () => { try { return typeof SBSTATS !== "undefined" ? SBSTATS.totalFocusMinutes() / 60 : 0; } catch (e) { return 0; } };
  /* Earning props */
  const PROP_UNIT = {hours: "h of focus", ontime: "tasks done on time", early: "tasks done 2+ days early", streak: "day streak", cards: "cards reviewed", quizzes: "quizzes passed",
    notes: "notes written", stickers: "scrapbook stickers", prep: "study-plan sessions done", checkins: "daily check-ins", groups: "study group or room", focusWeeks: "weeks with 4+ focus days", festive: "winter holiday visit"};
  const PROP_ASK = {hours: n => `Focus for ${n} ${n === 1 ? "hour" : "hours"}`, ontime: n => `Finish ${n} tasks on or before their due date`, early: n => `Finish ${n} tasks at least 2 days early`,
    streak: n => `Reach a ${n}-day streak`, cards: n => `Review ${n} flashcards`, quizzes: n => `Pass ${n} practice quizzes (70% or more)`, notes: n => `Write ${n} notes`,
    stickers: n => `Earn ${n} Term Scrapbook stickers`, prep: n => `Finish ${n} study-plan sessions`, checkins: n => `Open Studyboard on ${n} different days`,
    groups: () => "Join a study group or a Study Together room", focusWeeks: n => `Focus for 15+ minutes on 4 or more days in ${n} different ${n === 1 ? "week" : "weeks"}`, festive: () => "Visit between Dec 1 and Jan 6"};
  let pStat = null, pStatAt = 0;
  // Lifetime numbers, cached for a few seconds (the picker and the unlock check ask a lot)
  function propStats(){
    const now = Date.now(); if (pStat && now - pStatAt < 4000) return pStat;
    const s = {hours: 0, ontime: 0, early: 0, streak: 0, cards: 0, quizzes: 0, notes: 0, stickers: 0, prep: 0, checkins: 0, groups: 0, focusWeeks: 0, festive: 0};
    const tr = f => { try { f(); } catch (e) {} };
    tr(() => { s.hours = hours(); });
    tr(() => Object.values(state.tasks || {}).forEach(t => {
      if (t.status !== "done" || !t.doneAt || (t.created && t.doneAt - t.created < 60000)) return;
      if (t.prepFor) { s.prep++; return; }
      if (!t.due) return;
      const d = iso(new Date(t.doneAt));
      if (d <= t.due) s.ontime++;
      if (d <= addDays(t.due, -2)) s.early++;
    }));
    tr(() => { const k = shownStreak(); s.streak = Math.max(Number(k.best) || 0, Number(k.cur) || 0); });
    tr(() => Object.values(state.decks || {}).forEach(d => {
      (d.cards || []).forEach(x => { s.cards += Number(x.seen) || 0; });
      (d.quizzes || []).concat(...(d.aiQuizzes || []).map(q => q.results || [])).forEach(r => { if (r && Number(r.total) >= 3 && Number(r.score) / Number(r.total) >= 0.7) s.quizzes++; });
    }));
    tr(() => { s.notes = Object.values(state.notes || {}).filter(n => String(n.text || "").trim().length >= 15).length; });
    tr(() => { const sc = state.settings && state.settings.scrap; if (sc) { s.stickers = [sc.cur].concat(sc.past || []).reduce((n, p) => n + (p && p.g ? Object.keys(p.g).length : 0), 0);
      s.groups = ["gp", "rm"].filter(k => sc.f && sc.f[k]).length; } });
    tr(() => { s.checkins = (cfg().ci || []).length; });
    tr(() => { const per = {}; Object.entries(SBSTATS.focusDays()).forEach(([d, m]) => { if (Number(m) >= 15) { const w = mondayOf(d); per[w] = (per[w] || 0) + 1; } }); s.focusWeeks = Object.values(per).filter(n => n >= 4).length; });
    tr(() => { const d = new Date(), m = d.getMonth(), day = d.getDate(); s.festive = m === 11 || (m === 0 && day <= 6) ? 1 : 0; });
    pStat = s; pStatAt = now;
    return s;
  }
  const pathsOf = a => (a.hours ? [["hours", a.hours]] : []).concat(a.paths || []);
  const wasEarned = a => !!(cfg().earned || {})[a.id];
  // How far along each way of getting this prop is
  const propProg = a => { const s = propStats(); return pathsOf(a).map(([k, n]) => { const v = Math.min(Number(s[k]) || 0, n); return {k, n, v: k === "hours" ? Math.round(v * 10) / 10 : Math.floor(v), p: v / n, ask: PROP_ASK[k](n), unit: PROP_UNIT[k]}; }); };
  const isEarned = a => !!a && (wasEarned(a) || propProg(a).some(x => x.p >= 1));
  const unlocked = () => ACC.filter(isEarned);
  const closestPath = a => propProg(a).sort((x, y) => y.p - x.p)[0];
  const pathShort = x => x.k === "festive" || x.k === "groups" ? x.unit : `${x.v} of ${x.n} ${x.unit}`;
  const canWear = a => !!a && isEarned(a) && owns("prop", a.id);
  // What it wears now
  const wearOf = c => wornList((cfg().wear || {})[c.id]).filter(id => canWear(ACC.find(x => x.id === id)));
  function wearColor(c){
    if (c.wearColor) return c.wearColor;
    const s = SKINS.find(x => x.id === skinId());
    return s && s.light ? s.light[8] : "#1F6FEB";
  }

  /* Conditions */
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const still = () => (styleCfg() || {}).motion === false || !!(window.SBMotion && SBMotion.level() !== "full");
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- An actor: animations on one rendered rig ---------- */
  function actor(c, root, opts){
    opts = opts || {};
    const svg = root.querySelector(".cp-svg"), mover = root.querySelector(".cp-move") || svg;
    const q = s => svg.querySelector(s);
    const part = n => q(".cp-" + n);
    const running = new Set();
    const anim = (el, frames, ms, o) => {
      if (!el || still() || !el.animate) return null;
      const a = el.animate(frames, Object.assign({duration: ms, easing: "ease-in-out"}, o));
      if (opts.watch) opts.watch(ms);
      running.add(a); a.onfinish = a.oncancel = () => running.delete(a);
      return a;
    };
    const rot = d => ({transform: `rotate(${d}deg)`});
    const side = n => /L$/.test(n) ? 1 : -1;
    const has = n => !!part(n);
    const armOf = () => has("armR") ? "armR" : has("armL") ? "armL" : "";
    const A = {
      c, root, svg,
      eyes(s){ svg.dataset.e = s || "open"; },
      mouth(s){ svg.dataset.m = s || "neutral"; },
      prop(p){ svg.dataset.prop = p || ""; },
      look(dx, dy){
        const e = c.eyes, rr = 0.42 * e.r;
        svg.querySelectorAll(".cp-look").forEach(l => { l.style.transform = `translate(${f1(dx * rr)}px,${f1(dy * rr)}px)`; });
      },
      blink(){ if (svg.dataset.e !== "open") return; svg.querySelectorAll(".cp-eye").forEach(e => e.animate && e.animate([{transform: "scaleY(1)"}, {transform: "scaleY(.08)"}, {transform: "scaleY(1)"}], {duration: 150, easing: "ease-in-out"})); },
      has,
      move(frames, ms, o){ return anim(mover, frames, ms, Object.assign({composite: "replace"}, o)); },
      part(name, frames, ms, o){ return anim(part(name), frames, ms, o); },
      stopAll(){ running.forEach(a => { try { a.cancel(); } catch (e) {} }); running.clear(); },
      spawn: opts.spawn || (() => {}),
      motion(name, big){
        const k = big ? 1.5 : 1;
        switch (name) {
          case "tailSwish": return A.part("tail", [0, 14 * k, -9 * k, 11 * k, -4, 0].map(rot), 1500);
          case "earTwitch": { const n = has("earL") && (!has("earR") || Math.random() < 0.5) ? "earL" : "earR"; return A.part(n, [0, -16 * side(n) * k, 5 * side(n), -9 * side(n), 0].map(rot), 560); }
          case "wingFlutter": { const [l, r] = has("wingL") ? ["wingL", "wingR"] : ["armL", "armR"]; const f = s => [0, 26, 4, 26, 4, 22, 0].map(d => rot(d * s * k)); A.part(l, f(1), 760); return A.part(r, f(-1), 760); }
          case "finWiggle": { const n = ["armL", "armR", "wingL", "wingR", "tail"].filter(has); n.forEach(p => A.part(p, [0, 10, -8, 10, -8, 6, 0].map(d => rot(d * (p === "tail" ? 1 : side(p)) * k)), 900)); return null; }
          case "wave": { const n = armOf(); if (!n) return A.motion("hop"); const s = side(n), up = 115 * s; return A.part(n, [0, up, up - 22 * s, up, up - 22 * s, up, 0].map(rot), 1500, {easing: "ease-in-out"}); }
          case "headTilt": if (!partSvg(c.parts.head)) return null; return anim(q(".cp-headg"), [0, 9, 9, -4, 0].map(rot), 1800);
          case "topBob": return A.part("top", [0, 13 * k, -11 * k, 7, -3, 0].map(rot), 1300);
          case "bounce": return A.move([0, -6 * k, 0, -3 * k, 0].map((y, i) => ({transform: `translateY(${y}px) scale(${i % 2 ? "0.97,1.04" : i ? "1.04,0.96" : "1,1"})`})), 900);
          case "hop": return A.move([{transform: "translateY(0) scale(1,1)"}, {transform: "translateY(2px) scale(1.08,.9)", offset: 0.15}, {transform: `translateY(${-16 * k}px) scale(.95,1.06)`, offset: 0.45}, {transform: "translateY(1px) scale(1.07,.92)", offset: 0.8}, {transform: "translateY(0) scale(1,1)"}], 720);
          case "spin": return A.move([{transform: "perspective(400px) rotateY(0deg)"}, {transform: "perspective(400px) rotateY(360deg)"}], 900, {easing: "cubic-bezier(.5,0,.3,1)"});
          case "sway": return A.move([0, 4, -4, 3, 0].map(d => ({transform: `rotate(${d * k}deg)`})), 1900);
          case "waddle": return A.move([0, -6, 6, -6, 6, 0].map((d, i) => ({transform: `translateX(${i % 2 ? -1.5 : i ? 1.5 : 0}px) rotate(${d}deg)`})), 1200);
          case "sparkle": A.spawn("sparkle", big ? 5 : 3); return null;
          case "stretch": { ["armL", "armR"].filter(has).forEach(p => A.part(p, [0, 150 * side(p), 150 * side(p), 0].map(rot), 1500)); return A.move([{transform: "scale(1,1)"}, {transform: "scale(.96,1.08)", offset: 0.35}, {transform: "scale(.96,1.08)", offset: 0.65}, {transform: "scale(1,1)"}], 1500); }
          case "flip": return anim(q(".cp-page"), [{transform: "scaleX(1)"}, {transform: "scaleX(-1)"}], 700, {easing: "ease-in-out"});
          case "nod": if (!partSvg(c.parts.head)) return null; return anim(q(".cp-headg"), [0, 6, 0].map(rot), 700);
        }
        return null;
      }
    };
    return A;
  }

  /* ---------- The companion on screen: its home beside the Add Task button ----------
     It sits just to the left of the floating Add Task button, on the same baseline, on desktop and phone. Pages
     already keep bottom space free for the button; that space is widened to cover the companion too. Where a page
     has no Add Task button, it takes the same bottom-right spot. A toast that would overlap it (toasts sit bottom
     centre) makes it step aside for a moment. */
  let layer = null, front = null, box = null, act = null, cur = null, curSig = "", mood = "idle", home = "", homeSig = "";
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearTimers = () => { timers.forEach(t => clearTimeout(t)); timers.clear(); };
  const phone = () => innerWidth < 640;
  const sizePx = c => { const s = c ? c.size : 1; return Math.round((phone() ? Math.max(62, Math.min(72, 66 * s)) : Math.max(86, Math.min(108, 96 * s))) * shrink); };
  const GAP = 26;

  function geometry(){
    const nav = document.querySelector("nav.tabs"), r = nav && nav.getBoundingClientRect();
    const sideNav = !!(r && r.width && r.left < 4 && r.height > innerHeight * 0.6);
    const side = sideNav ? Math.round(r.right) : 0;
    return {nav, r, sideNav, side};
  }

  /* The placement guard */
  const MARGIN = 8;
  const AN_UP = 26, AN_SIDE = 6, AN_DN = 3;
  let probe = null, vext = null, shrink = 1, guardFixes = 0, guardLast = null, sCache = null, sAt = 0;
  function insets(){
    try {
      if (!probe || !probe.isConnected) { probe = document.createElement("div"); probe.className = "cp-probe"; probe.setAttribute("aria-hidden", "true"); document.body.appendChild(probe); }
      const cs = getComputedStyle(probe), n = v => Math.max(0, parseFloat(v) || 0);
      return {t: n(cs.paddingTop), r: n(cs.paddingRight), b: n(cs.paddingBottom), l: n(cs.paddingLeft)};
    } catch (e) { return {t: 0, r: 0, b: 0, l: 0}; }
  }
  // In the coordinates fixed elements use (the layout viewport)
  function safeRect(fresh){
    const now = performance.now();
    if (!fresh && sCache && now - sAt < 40) return sCache;
    const vv = window.visualViewport, ins = insets(), de = document.documentElement;
    const lw = de.clientWidth || innerWidth, lh = de.clientHeight || innerHeight;
    let l = 0, t = 0, r = lw, b = lh;
    if (vv) {
      const l2 = Math.max(l, vv.offsetLeft), t2 = Math.max(t, vv.offsetTop), r2 = Math.min(r, vv.offsetLeft + vv.width), b2 = Math.min(b, vv.offsetTop + vv.height);
      if (r2 - l2 >= 100 && b2 - t2 >= 100) { l = l2; t = t2; r = r2; b = b2; }
    }
    l = Math.max(l, ins.l); t = Math.max(t, ins.t); r = Math.min(r, lw - ins.r); b = Math.min(b, lh - ins.b);
    sCache = {l: l + MARGIN, t: t + MARGIN, r: r - MARGIN, b: b - MARGIN}; sAt = now;
    return sCache;
  }
  // Zoomed ancestors (CSS zoom) scale left/top
  const zf = () => { try { const w = front && front.offsetWidth; const z = w ? front.getBoundingClientRect().width / w : 1; return z > 0.25 && z < 4 ? z : 1; } catch (e) { return 1; } };
  // The art as drawn right now, in client pixels
  function visual(){
    if (!box || box.hidden) return null;
    let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
    const add = (r, pad) => { if (!r || (!r.width && !r.height)) return; L = Math.min(L, r.left - pad); T = Math.min(T, r.top - pad); R = Math.max(R, r.right + pad); B = Math.max(B, r.bottom + pad); };
    const pad = Math.ceil((box.offsetWidth || 66) * 0.04) + 2;
    const rig = box.querySelector(".cp-rig"), sh = box.querySelector(".cp-shadow"), hit = box.querySelector(".cp-hit");
    if (rig) add(rig.getBoundingClientRect(), pad);
    if (sh) add(sh.getBoundingClientRect(), 0);
    if (hit) add(hit.getBoundingClientRect(), 0);
    return L > R ? null : {left: L, top: T, right: R, bottom: B, width: R - L, height: B - T};
  }
  // How far the art reaches from the box's top-left corner, as a share of the box size
  function measureArt(){
    try {
      if (!box || !box.isConnected || box.hidden) return null;
      const V = visual(), b = box.getBoundingClientRect(); if (!V || b.width < 20 || !(b.width > 0)) return null;
      return (vext = {l: (V.left - b.left) / b.width, t: (V.top - b.top) / b.height, r: (V.right - b.left) / b.width, b: (V.bottom - b.top) / b.height});
    } catch (e) { return null; }
  }
  const DEF_ART = {l: 0.04, t: 0.04, r: 0.96, b: 1};
  // The box positions (left/top) whose art, with room for its own motions
  function range(px, fresh){
    const S = safeRect(fresh), g = geometry(), e = vext || measureArt() || DEF_ART;
    return {L: Math.max(S.l, g.side + 6) - e.l * px + AN_SIDE, R: S.r - e.r * px - AN_SIDE, T: S.t - e.t * px + AN_UP, B: S.b - e.b * px - AN_DN};
  }
  const feasible = rg => rg.L <= rg.R && rg.T <= rg.B;
  // It stays in the lower part of the screen
  const lowTop = (rg, fresh) => { const S = safeRect(fresh); return Math.min(rg.B, Math.max(rg.T, S.t + (S.b - S.t) * 0.6)); };
  let guardDepth = 0;
  // The authority
  function clamp(why){
    if (!box || box.hidden || !cur || !front || guardDepth) return false;
    if (dockFrozen()) return false;
    if (spotKind === "slot" && typeof ui !== "undefined" && ui.tab === "companion") return false;
    if (glideAnim && performance.now() < glideEnd) return false;
    const S = safeRect(true); if (S.r - S.l < 60 || S.b - S.t < 60) return false;
    let V = visual(); if (!V) return false;
    if ((V.width > S.r - S.l || V.height > S.b - S.t) && shrink > 0.5) {
      guardDepth++; try { shrink = Math.max(0.5, shrink * Math.min((S.r - S.l) / V.width, (S.b - S.t) / V.height) * 0.95); homeSig = ""; place(false); } finally { guardDepth--; }
      return true;
    }
    let dx = 0, dy = 0;
    if (V.left < S.l) dx = S.l - V.left; else if (V.right > S.r) dx = S.r - V.right;
    if (V.top < S.t) dy = S.t - V.top; else if (V.bottom > S.b) dy = S.b - V.bottom;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { if (bubbleOut()) { const b = front.querySelector(".cp-bubble.on"); if (b) placeBubble(b); } return false; }
    const z = zf(), x = (parseFloat(box.style.left) || +box.dataset.x || 0) + dx / z, y = (parseFloat(box.style.top) || +box.dataset.y || 0) + dy / z;
    box.style.left = f1(x) + "px"; box.style.top = f1(y) + "px";
    if (why !== "anim" && why !== "anim-end" && Math.hypot(dx, dy) <= 240) glideBy(-dx / z, -dy / z);
    box.dataset.x = f1(x); box.dataset.y = f1(y); homeSig = [f1(x), f1(y), box.dataset.px].join(",");
    guardFixes++; guardLast = {why, dx: f1(dx), dy: f1(dy), w: innerWidth, h: innerHeight};
    if ((why === "watchdog" || why === "anim") && Math.hypot(dx, dy) >= 3 && guardFixes <= 3) { try { if (window.SBERR) SBERR.flow("companion-bounds", new Error(`companion was off screen (${why}) by ${Math.round(dx)},${Math.round(dy)} at ${innerWidth}x${innerHeight}, ${mood}`)); } catch (e) {} }
    const b = front.querySelector(".cp-bubble.on"); if (b) placeBubble(b);
    fitHitSoon();
    return true;
  }
  /* Smooth moves only */
  let glideAnim = null, glideEnd = 0;
  function glideBy(ox, oy, sc, replace){
    if (!box || still() || document.hidden || !box.animate) return;
    const d = Math.hypot(ox, oy), ms = Math.round(Math.max(220, Math.min(520, 200 + d * 1.2)));
    if (d < 0.5 && (!sc || Math.abs(sc - 1) < 0.01)) return;
    if (glideAnim) try { glideAnim.cancel(); } catch (e) {}
    const me = glideAnim = box.animate([{transform: `translate(${f1(ox)}px,${f1(oy)}px)${sc ? ` scale(${f1(sc)})` : ""}`}, {transform: "translate(0px,0px) scale(1)"}], Object.assign({duration: ms, easing: "cubic-bezier(.22,.8,.3,1)"}, replace ? {} : {composite: "add"}));
    glideEnd = performance.now() + ms; followBubble();
    const end = () => { if (glideAnim !== me) return; glideAnim = null; glideEnd = 0; try { clamp("glide-end"); } catch (e) {} const b = front && front.querySelector(".cp-bubble.on"); if (b) placeBubble(b); fitHitSoon(); };
    me.onfinish = me.oncancel = end;
  }
  const stopTravel = () => { if (!travelAnim) return; try { travelAnim.cancel(); } catch (e) {} travelAnim = null; if (box) delete box.dataset.travel; };
  // Where the box is drawn now (its centre, in style pixels)
  function drawnCentre(){
    const r = box.getBoundingClientRect(), z = zf();
    return {x: (r.left + r.right) / 2 / z, y: (r.top + r.bottom) / 2 / z};
  }
  const bubbleOut = () => {
    const b = front && front.querySelector(".cp-bubble.on"); if (!b) return false;
    const r = b.getBoundingClientRect(), S = safeRect();
    return r.left < S.l - 0.5 || r.right > S.r + 0.5 || r.top < S.t - 0.5 || r.bottom > S.b + 0.5;
  };
  let gT = 0;
  const guardSoon = (why, ms) => { if (gT) return; gT = setTimeout(() => { gT = 0; try { clamp(why); } catch (e) { console.warn("companion guard", e); } fitHitSoon(); }, ms == null ? 60 : ms); };
  // While any of its animations runs, look at it every frame
  let mwEnd = 0, mwRaf = 0;
  function motionWatch(ms){
    if (still()) return;
    mwEnd = Math.max(mwEnd, performance.now() + (ms || 1000) + 100);
    if (mwRaf) return;
    const step = () => { mwRaf = 0; if (!box || box.hidden || still()) return; try { clamp("anim"); } catch (e) {} if (performance.now() < mwEnd) mwRaf = requestAnimationFrame(step); };
    mwRaf = requestAnimationFrame(step);
  }
  /* Controls (buttons, links, fields) under its tap area */
  const CTL_SEL = "button,a[href],input,select,textarea,summary,[role=button],[data-tab],#fab";
  function controlRects(){
    const out = [], W = innerWidth, H = innerHeight;
    document.querySelectorAll(CTL_SEL).forEach(el => {
      if ((layer && layer.contains(el)) || (front && front.contains(el)) || el.closest("#compFront,#compLayer")) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.right <= 0 || r.top >= H || r.left >= W || r.width * r.height > W * H * 0.3) return;
      if (el.checkVisibility && !el.checkVisibility({checkVisibilityCSS: true})) return;
      out.push(r);
    });
    return out;
  }
  let fitT = 0;
  const fitHitSoon = () => { clearTimeout(fitT); fitT = setTimeout(fitHit, 120); };
  // A sheet open over the page covers the companion, so nothing can be under its tap area until it closes
  // (closing checks again). Skipping it keeps a long list in a sheet, like the Style Shop's companions, smooth.
  const sheetOver = () => { try { return !!document.querySelector("dialog:modal"); } catch (e) { return !!(dlg && dlg.open); } };
  function fitHit(){
    try {
      if (!box || box.hidden || sheetOver()) return;
      const hit = box.querySelector(".cp-hit"); if (!hit) return;
      hit.style.left = hit.style.right = hit.style.top = hit.style.bottom = ""; hit.classList.remove("cp-hit-off");
      const z = zf(), px = (+box.dataset.px || box.offsetWidth) * z;
      const base = {l: (parseFloat(box.style.left) || 0) * z + px * 0.1, r: (parseFloat(box.style.left) || 0) * z + px * 0.9, t: (parseFloat(box.style.top) || 0) * z + px * 0.04, b: (parseFloat(box.style.top) || 0) * z + px};
      const hits = controlRects().filter(c => c.left < base.r && c.right > base.l && c.top < base.b && c.bottom > base.t);
      box.dataset.over = hits.length ? "1" : "";
      if (!hits.length) return;
      let free = [base];
      hits.forEach(c => {
        const next = [];
        free.forEach(f => {
          if (c.left >= f.r || c.right <= f.l || c.top >= f.b || c.bottom <= f.t) { next.push(f); return; }
          if (c.top > f.t) next.push({l: f.l, r: f.r, t: f.t, b: c.top});
          if (c.bottom < f.b) next.push({l: f.l, r: f.r, t: c.bottom, b: f.b});
          if (c.left > f.l) next.push({l: f.l, r: c.left, t: Math.max(f.t, c.top), b: Math.min(f.b, c.bottom)});
          if (c.right < f.r) next.push({l: c.right, r: f.r, t: Math.max(f.t, c.top), b: Math.min(f.b, c.bottom)});
        });
        free = next.filter(f => f.r - f.l > 1 && f.b - f.t > 1);
      });
      free.sort((a, b) => (b.r - b.l) * (b.b - b.t) - (a.r - a.l) * (a.b - a.t));
      const best = free[0], need = Math.max(22, px * 0.3);
      if (!best || best.r - best.l < need || best.b - best.t < need) { hit.classList.add("cp-hit-off"); return; }
      const left = (parseFloat(box.style.left) || 0) * z, top = (parseFloat(box.style.top) || 0) * z;
      hit.style.left = f1((best.l - left) / z) + "px"; hit.style.right = f1((px - (best.r - left)) / z) + "px";
      hit.style.top = f1((best.t - top) / z) + "px"; hit.style.bottom = f1((px - (best.b - top)) / z) + "px";
    } catch (e) { console.warn("companion hit", e); }
  }

  // Is an element see-through layout (nothing a student would read or press)
  let passCache = new WeakMap();
  const passCacheReset = () => { passCache = new WeakMap(); };
  function passthrough(el){
    if (!el || el === document.documentElement || el === document.body) return true;
    if (passCache.has(el)) return passCache.get(el);
    let ok = true;
    if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|IMG|SVG|CANVAS|VIDEO|DIALOG|NAV|IFRAME|P|H1|H2|H3|H4|SPAN|B|I|EM|STRONG|LI|TD|TH)$/.test(el.tagName.toUpperCase())) ok = false;
    else if (el.closest("[data-act],[data-tab],[role=button],[contenteditable=true],dialog,nav,.fab,.toast,.cp-front,svg")) ok = false;
    else {
      const cs = getComputedStyle(el);
      const alpha = s => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return s === "transparent" ? 0 : 1; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
      if (alpha(cs.backgroundColor) > 0.04 || cs.backgroundImage !== "none" || cs.boxShadow !== "none" || (cs.backdropFilter && cs.backdropFilter !== "none")) ok = false;
      else if (["Top", "Right", "Bottom", "Left"].some(s => parseFloat(cs["border" + s + "Width"]) > 0 && alpha(cs["border" + s + "Color"]) > 0.1)) ok = false;
      else if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) ok = false;
    }
    passCache.set(el, ok);
    return ok;
  }
  // Is the pointer on the companion
  function ours(x, y){
    if (!box || !act || box.hidden) return false;
    const hit = box.querySelector(".cp-hit"), r = hit.getBoundingClientRect();
    if (hit.classList.contains("cp-hit-off")) return false;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
    for (const el of document.elementsFromPoint(x, y)) { if (el === hit) return true; if (box.contains(el)) continue; if (!passthrough(el)) return false; }
    return false;
  }
  // Where the Add Task button is (or would be, on pages without it)
  const fabMem = {};
  function fabRect(){
    const f = document.getElementById("fab"), key = phone() ? "p" : "d";
    const r = f && f.getBoundingClientRect(), shown = f && r.width > 0 && getComputedStyle(f).display !== "none" && getComputedStyle(f).visibility !== "hidden";
    if (shown) { fabMem[key] = {right: innerWidth - r.right, bottom: innerHeight - r.bottom, w: r.width, h: r.height}; return {left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height, shown: true}; }
    const m = fabMem[key] || (phone() ? {right: 16, bottom: 92, w: 140, h: 52} : {right: 32, bottom: 28, w: 144, h: 48});
    const right = innerWidth - m.right, bottom = innerHeight - m.bottom;
    return {left: right - m.w, top: bottom - m.h, right, bottom, w: m.w, h: m.h, shown: false};
  }
  /* Where it can stand */
  const SKIP = el => !el || el === document.documentElement || el === document.body || (layer && layer.contains(el)) || (front && front.contains(el)) || !!el.closest("#sceneArt,#compLayer,#compFront");
  const INTERACTIVE = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|IMG|VIDEO|CANVAS|IFRAME|DIALOG)$/;
  function contentAt(x, y){
    let surface = false;
    for (const el of document.elementsFromPoint(x, y)) {
      if (SKIP(el)) continue;
      const tag = el.tagName.toUpperCase();
      if (getComputedStyle(el).pointerEvents === "none" && !el.children.length && !el.textContent.trim()) continue;
      if (INTERACTIVE.test(tag) || el.closest("[data-act],[data-tab],[role=button],[contenteditable=true],nav,.fab,.toast,.note,.stk,.card")) return {hard: true};
      if (tag === "SVG" || el.closest("svg")) return {hard: true};
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) if (x >= q.left - 6 && x <= q.right + 6 && y >= q.top - 6 && y <= q.bottom + 6) return {hard: true};
      }
      if (!passthrough(el)) surface = true;
    }
    return {hard: false, surface};
  }
  // Everything a student reads or presses on screen right now, as rectangles
  const CONTENT_SEL = "button,a,input,select,textarea,label,img,video,canvas,iframe,[data-act],[data-tab],[role=button],[contenteditable=true],.note,.stk,.chip,.badge,#nbScroll,.tl-scroll,.sch-grid,.env";
  function contentRects(){
    const out = [], W = innerWidth, H = innerHeight;
    const skip = el => !el || (layer && layer.contains(el)) || (front && front.contains(el)) || !!el.closest("#sceneArt,#compLayer,#compFront,nav.tabs,.fab,#fab");
    const vis = r => r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < H && r.left < W;
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode: n => n.textContent.trim() && !skip(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT});
    const rg = document.createRange();
    for (let n = tw.nextNode(), k = 0; n && k < 4000; n = tw.nextNode(), k++) {
      const pe = n.parentElement; if (!pe.offsetParent && getComputedStyle(pe).position !== "fixed") continue;
      rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (vis(r)) out.push(r);
    }
    document.querySelectorAll(CONTENT_SEL).forEach(el => { if (skip(el)) return; const r = el.getBoundingClientRect(); if (vis(r)) out.push(r); });
    document.querySelectorAll("svg").forEach(el => { if (skip(el) || el.closest("button,a,[data-act]")) return; const r = el.getBoundingClientRect(); if (vis(r) && r.width < W * 0.6) out.push(r); });
    return out;
  }
  let RECTS = null;
  function spotCheck(c, px, f){
    const rg = range(px);
    if (c.left < rg.L - 0.5 || c.left > rg.R + 0.5 || c.top < rg.T - 0.5 || c.top > rg.B + 0.5) return {hard: true};
    if (f.shown && c.left + px * 0.9 > f.left - 4 && c.left + px * 0.1 < f.right + 4 && c.top + px > f.top - 4 && c.top < f.bottom + 4) return {hard: true};
    const t = document.getElementById("toast");
    if (t && t.classList.contains("show")) { const q = t.getBoundingClientRect(); if (c.left < q.right && c.left + px > q.left && c.top < q.bottom && c.top + px > q.top) return {hard: true}; }
    const a = {l: c.left + px * 0.08 - 6, r: c.left + px * 0.92 + 6, t: c.top + px * 0.1 - 6, b: c.top + px * 0.97 + 4};
    for (const q of (RECTS || (RECTS = contentRects()))) if (q.left < a.r && q.right > a.l && q.top < a.b && q.bottom > a.t) return {hard: true};
    let surface = false;
    for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.2, 0.55, 0.9]) { const r = contentAt(c.left + px * fx, c.top + px * fy); if (r.hard) return {hard: true}; if (r.surface) surface = true; }
    return {hard: false, surface};
  }
  // Each page has its own favourite stretch of the bottom of the screen
  const PAGE_X = {board: 0.84, timeline: 0.3, schedule: 0.62, flashcards: 0.44, notes: 0.16, files: 0.72, courses: 0.92, groups: 0.36, grades: 0.54, archive: 0.24, study: 0.5};
  let pageWant = {tab: "", x: 0.8};
  function wantX(fresh){
    const tab = (typeof ui !== "undefined" && ui.tab) || "board";
    if (fresh || pageWant.tab !== tab) pageWant = {tab, x: Math.max(0.05, Math.min(0.97, (PAGE_X[tab] ?? 0.6) + rand(-0.07, 0.07)))};
    return pageWant.x;
  }
  function candidates(px, f, fresh){
    const rg = range(px), feet = px * (112 / 120), ground = Math.round(Math.min(f.bottom - feet, rg.B)), L = rg.L, R = Math.max(rg.L, rg.R), out = [];
    const want = L + (R - L) * wantX(fresh), span = Math.max(1, R - L);
    const home = {left: Math.round(f.left - GAP - px), top: ground, kind: "home"};
    home.score = Math.abs(home.left - want) / span * 220 - 12;
    out.push(home);
    for (let x = L; x <= R; x += px * 0.5) out.push({left: Math.round(x), top: ground, kind: "ground", score: Math.abs(x - want) / span * 220});
    const lowT = lowTop(rg);
    for (let y = f.top - px - 10, k = 1; y >= Math.max(40, rg.T, lowT); y -= px * 0.7, k++) out.push({left: Math.round(R - 2), top: Math.round(y), kind: "side", score: 240 + k * 16});
    const float = cur && cur.pose === "float";
    for (let y = Math.min(innerHeight - px - 16, rg.B), ky = 0; y >= Math.max(30, rg.T, lowT); y -= px * 0.8, ky++) for (let x = R - 2, kx = 0; x >= L; x -= px * 0.8, kx++) out.push({left: Math.round(x), top: Math.round(y), kind: "open", score: 320 + kx * 5 + ky * (float ? 5 : 12)});
    return out;
  }
  // Round seats (the Companion tab's ring, the phone dock) centre the whole drawing, so a companion
  // that stands low in its picture is lifted until it sits level with the rest
  const SEAT_LIFT = {};
  function seatLift(c, px){
    if (!c) return 0;
    let u = SEAT_LIFT[c.id];
    if (u === undefined) {
      u = 0;
      try {
        const host = document.createElement("div"); host.style.cssText = "position:fixed;left:-999px;top:0;width:120px;height:120px;visibility:hidden;pointer-events:none";
        host.innerHTML = rigSvg(c, {}).replace(/<g class="cp-zs">[\s\S]*?<\/g>/, ""); document.body.appendChild(host);
        let top = 1e9, bot = -1e9;
        host.querySelectorAll(".cp-p").forEach(g => { try { const b = g.getBBox(); if (b.width && b.height) { top = Math.min(top, b.y); bot = Math.max(bot, b.y + b.height); } } catch (e) {} });
        host.remove();
        if (bot > top) u = Math.max(0, Math.min(18, (top + bot) / 2 - 62));
      } catch (e) {}
      SEAT_LIFT[c.id] = u;
    }
    return Math.round(u / VB * px);
  }
  let spotKind = "", spotSig = "";
  // fresh: choose from scratch (a new page)
  function slotSpot(px){
    if (typeof ui === "undefined" || ui.tab !== "companion") return null;
    const el = document.querySelector(".cpt-face-slot"); if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 20) return null;
    px = Math.max(px, Math.round(Math.min(r.width, r.height) * 1.02));
    return {left: Math.round(r.left + (r.width - px) / 2), top: Math.round(r.top + (r.height - px) / 2 - seatLift(cur, px)), kind: "slot", px};
  }
  // Phones: its seat in the middle of the bottom tab bar
  function dockSpot(px){
    if (!phone() || (typeof ui !== "undefined" && ui.tab === "companion")) return null;
    const el = document.querySelector('nav.tabs .in [data-tab="companion"]'); if (!el) return null;
    const r = el.getBoundingClientRect(); if (r.width < 20 || r.height < 20) return null;
    const seat = 56, cx = r.left + r.width / 2, seatTop = r.top - 16, sz = Math.round(seat * 0.86);
    return {left: Math.round(cx - sz / 2), top: Math.round(seatTop + (seat - sz) / 2 - seatLift(cur, sz)), kind: "dock", px: sz};
  }
  function choose1(fresh){
    const px = sizePx(cur), f = fabRect();
    { const sl = slotSpot(px); if (sl) return Object.assign({px}, sl, {fab: f}); }
    { const dk = dockSpot(px); if (dk) return Object.assign({px}, dk, {fab: f}); }
    // Desktop, "Companion Stays Put": always the bottom-left corner (the Companion page still seats it in its ring, above)
    if (staysPut()) { const rg = range(px); return {left: Math.round(rg.L), top: Math.round(Math.max(rg.T, rg.B)), kind: "corner", px, fab: f}; }
    if (spotKind === "slot") fresh = true;
    if (phone()) {
      const rg = range(px), feet = px * (112 / 120), left = Math.round(Math.min(Math.max(rg.L, rg.R), Math.max(rg.L, f.shown ? f.left - 4 - px : f.right - px)));
      const top = Math.round(Math.min(Math.max(rg.T, rg.B), Math.max(rg.T, f.bottom - feet)));
      return {left, top, kind: "pin", px, fab: f};
    }
    const here = box && box.dataset.x ? {left: +box.dataset.x, top: +box.dataset.y} : null;
    RECTS = null;
    if (!fresh && here && +box.dataset.px === px && spotKind) { const b = spotCheck(here, px, f); if (!b.hard) return Object.assign(here, {kind: spotKind, px, fab: f}); }
    RECTS = null;
    // It stands level with the Add button, never higher up the page
    const list = candidates(px, f, fresh).filter(c => c.kind === "home" || c.kind === "ground").sort((a, b) => a.score - b.score);
    let best = null, tested = 0;
    for (const c of list) {
      if (best && c.score >= best.score) break;
      if (++tested > 60) break;
      if (here && !fresh && Math.hypot(c.left - here.left, c.top - here.top) < px) c.score -= 40;
      const b = spotCheck(c, px, f); if (b.hard) continue;
      if (b.surface) { if (c.kind !== "home" && c.kind !== "ground") continue; c.score += 45; }
      if (!best || c.score < best.score) best = c;
    }
    if (!best) { const h = list.find(c => c.kind === "home"), rg = range(px); best = h ? {left: Math.round(Math.min(Math.max(rg.L, rg.R), Math.max(rg.L, h.left))), top: Math.round(Math.min(Math.max(rg.T, rg.B), Math.max(rg.T, h.top))), kind: "home"} : edgeSpot(px, f, list, here, fresh); }
    // No clear spot: it waits in its reserved place beside the Add button (the page keeps room below its last row for it) rather than on top of text or buttons
    if (best.kind === "edge" && best.over > 0) { const h = list.find(c => c.kind === "home"), rg = range(px); if (h) best = {left: Math.round(Math.min(Math.max(rg.L, rg.R), Math.max(rg.L, h.left))), top: Math.round(Math.min(Math.max(rg.T, rg.B), Math.max(rg.T, h.top))), kind: "home"}; }
    return Object.assign(best, {px, fab: f});
  }
  function choose(fresh){
    shrink = 1;
    while (shrink > 0.55 && !feasible(range(sizePx(cur), true))) shrink = Math.round((shrink - 0.05) * 100) / 100;
    const fit = shrink;
    let s = choose1(fresh);
    const keepSize = typeof ui !== "undefined" && ui.tab === "courses";
    if (!keepSize && s.kind === "edge" && s.over > 0 && fit >= 1 && sizePx(cur) > 52) {
      shrink = 0.82;
      const t = choose1(fresh);
      if (t.kind !== "edge" || t.over < s.over * 0.6) s = t; else shrink = fit;
    }
    return s;
  }
  // The best fully-on-screen spot when no open spot exists
  function edgeSpot(px, f, list, here, fresh){
    const rg = range(px), rects = (RECTS || (RECTS = contentRects())).slice(0, 1800), ctl = controlRects();
    const e = vext || DEF_ART, S = safeRect(), g = geometry();
    const X0 = rg.L, X1 = Math.max(rg.L, rg.R), Y1 = Math.max(rg.T, rg.B), Y0 = Math.min(Y1, Math.max(rg.T, lowTop(rg)));
    const home = list.find(c => c.kind === "home") || {left: X1, top: Y1};
    const hx = Math.min(X1, Math.max(X0, home.left)), hy = Math.min(Y1, Math.max(Y0, home.top));
    const heavy = [];
    if (f.shown) heavy.push({left: f.left - 4, right: f.right + 4, top: f.top - 4, bottom: f.bottom + 4});
    if (g.nav && g.r && g.r.width) heavy.push(g.r);
    const step = Math.max(px * 0.5, Math.sqrt(Math.max(1, (X1 - X0) * (Y1 - Y0)) / 260));
    const xs = [], ys = [];
    for (let x = X0; x < X1; x += step) xs.push(x); xs.push(X1);
    for (let y = Y0; y < Y1; y += step) ys.push(y); ys.push(Y1);
    const hitA = (x, y, a, rs) => { let t = 0; for (const q of rs) { const ox = Math.min(a.r, q.right) - Math.max(a.l, q.left), oy = Math.min(a.b, q.bottom) - Math.max(a.t, q.top); if (ox > 0 && oy > 0) t += ox * oy; } return t; };
    let best = null;
    const test = (x, y, kind) => {
      x = Math.round(x); y = Math.round(y);
      const a = {l: x + px * e.l + 3, r: x + px * e.r - 3, t: y + px * e.t + 3, b: y + px * e.b - 3};
      const over = hitA(x, y, a, rects) + 6 * hitA(x, y, a, ctl) + 10 * hitA(x, y, a, heavy);
      const edge = Math.min(x - X0, X1 - x, y - Y0, Y1 - y);
      let score = over + Math.hypot(x - hx, y - hy) * 0.5 + Math.min(edge, 200) * 0.3;
      if (here && !fresh && Math.hypot(x - here.left, y - here.top) < px * 0.6) score -= 150;
      if (!best || score < best.score) best = {left: x, top: y, kind: "edge", score, over: Math.round(over), at: kind};
    };
    ys.forEach(y => xs.forEach(x => test(x, y, "grid")));
    test(hx, hy, "home"); test(X0, Y1, "corner"); test(X1, Y1, "corner"); test(X0, Y0, "corner"); test(X1, Y0, "corner");
    return best || {left: Math.round(hx), top: Math.round(hy), kind: "edge", score: 999, over: 0};
  }
  // Travel to a new spot in character, picked from a few fun styles
  let travelAnim = null, followRaf = 0;
  function puff(x, y, big){
    if (!front || still()) return;
    const d = document.createElement("span"); d.className = "cp-dust" + (big ? " big" : ""); const S = safeRect();
    x = Math.max(S.l + 23, Math.min(S.r - 23, x)); y = Math.max(S.t + 10, Math.min(S.b - 8, y));
    d.style.left = Math.round(x) + "px"; d.style.top = Math.round(y) + "px";
    front.appendChild(d); setTimeout(() => d.remove(), 700);
  }
  function lines(fromX, y, dir){
    if (!front || still()) return;
    const d = document.createElement("span"), S = safeRect(); d.className = "cp-speed";
    fromX = Math.max(S.l + 40 + 40, Math.min(S.r - 40 - 40, fromX)); y = Math.max(S.t + 16, Math.min(S.b - 16, y));
    d.style.left = Math.round(fromX) + "px"; d.style.top = Math.round(y) + "px";
    d.style.setProperty("--dir", dir); front.appendChild(d); setTimeout(() => d.remove(), 800);
  }
  function followBubble(){
    cancelAnimationFrame(followRaf);
    const step = () => { const b = front && front.querySelector(".cp-bubble.on"); if (b) placeBubble(b); if (travelAnim || glideAnim) followRaf = requestAnimationFrame(step); };
    followRaf = requestAnimationFrame(step);
  }
  // Every keyframe of a trip
  function fitFrames(frames, to, px){
    try {
      const S = safeRect(true), e = vext || measureArt() || DEF_ART, pad = Math.ceil(px * 0.04) + 2;
      const cx = to.left + px / 2, cy = to.top + px / 2;
      const corners = [[e.l, e.t], [e.r, e.t], [e.r, e.b], [e.l, e.b]].map(([a, b]) => [a * px - px / 2 - (a < 0.5 ? pad : -pad), b * px - px / 2 - (b < 0.5 ? pad : -pad)]);
      frames.forEach(fr => {
        const m = /^translate\(([-\d.]+)px,\s*([-\d.]+)px\)(.*)$/.exec(fr.transform || ""); if (!m || fr.offset === 1) return;
        let x = +m[1], y = +m[2];
        const ops = []; m[3].replace(/(rotate|scale)\(([^)]*)\)/g, (all, k, v) => { const n = v.split(",").map(t => parseFloat(t)); ops.push(k === "rotate" ? {a: n[0] * Math.PI / 180} : {sx: n[0], sy: n.length > 1 ? n[1] : n[0]}); return all; });
        let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        corners.forEach(([px0, py0]) => {
          let X = px0, Y = py0;
          for (let i = ops.length - 1; i >= 0; i--) { const o = ops[i]; if (o.a != null) { const c = Math.cos(o.a), sn = Math.sin(o.a), nx = X * c - Y * sn; Y = X * sn + Y * c; X = nx; } else { X *= o.sx; Y *= o.sy; } }
          minX = Math.min(minX, X); maxX = Math.max(maxX, X); minY = Math.min(minY, Y); maxY = Math.max(maxY, Y);
        });
        const L = cx + x + minX, R = cx + x + maxX, T = cy + y + minY, B = cy + y + maxY;
        if (L < S.l) x += S.l - L; else if (R > S.r) x -= R - S.r;
        if (T < S.t) y += S.t - T; else if (B > S.b) y -= B - S.b;
        fr.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)${m[3]}`;
      });
    } catch (err) { console.warn("companion trip", err); }
  }
  function travel(from, to, px, force){
    if (!box || !from || still() || document.hidden) return;
    const dx = from.left - to.left, dy = from.top - to.top, d = Math.hypot(dx, dy);
    if (d < 6) return;
    if (travelAnim) try { travelAnim.cancel(); } catch (e) {}
    const float = cur.pose === "float", dir = to.left > from.left ? 1 : -1, feetY = to.top + px * (112 / 120);
    const frames = []; let dur, easing = "linear";
    const T = (t, x, y, extra) => frames.push({transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)${extra || ""}`, offset: t});
    const style = force || d > Math.max(innerWidth * 0.55, 620) ? (force || "dash") : float ? (Math.random() < 0.55 ? "loop" : "wave") : (d > 260 && Math.random() < 0.4 ? "leap" : "hops");
    if (style === "dash") {
      dur = 900;
      T(0, dx, dy, " scale(1)"); T(0.14, dx + dir * 14, dy, ` scale(.86,1.12) rotate(${-dir * 6}deg)`);
      T(0.3, dx * 0.75, dy * 0.75, ` scale(1.35,.8) rotate(${dir * 4}deg)`); T(0.7, dx * 0.12, dy * 0.12, " scale(1.35,.8)");
      T(0.84, -dir * 10, 0, ` scale(.84,1.14) rotate(${-dir * 8}deg)`); T(0.93, dir * 3, 0, " scale(1.08,.93)"); T(1, 0, 0, " scale(1)");
      later(() => lines(from.left + px / 2, from.top + px * 0.45, dir), 200); later(() => lines(to.left + px / 2 - dir * px, to.top + px * 0.45, dir), 520);
      later(() => puff(to.left + px / 2, feetY, true), 760);
    } else if (style === "leap") {
      dur = Math.min(1350, 760 + d * 0.9); const h = Math.min(170, 80 + d * 0.2);
      T(0, dx, dy, " scale(1)"); T(0.12, dx, dy, " scale(1.12,.84)");
      for (let i = 1; i <= 8; i++) { const t = i / 8, x = dx * (1 - t), y = dy * (1 - t) - Math.sin(Math.PI * t) * h; T(0.12 + t * 0.7, x, y, ` rotate(${(dir * 360 * t).toFixed(0)}deg) scale(${t < 0.15 ? 0.94 : 1},${t < 0.15 ? 1.08 : 1})`); }
      T(0.9, 0, 0, " scale(1.16,.82)"); T(1, 0, 0, " scale(1)");
      later(() => puff(from.left + px / 2, from.top + px * (112 / 120)), dur * 0.12); later(() => puff(to.left + px / 2, feetY, true), dur * 0.84);
    } else if (style === "hops") {
      const hops = Math.max(2, Math.min(5, Math.round(d / 120))), h = Math.min(56, 26 + d / hops * 0.2);
      dur = Math.min(1500, 420 + hops * 230);
      T(0, dx, dy, " scale(1)");
      for (let k = 0; k < hops; k++) {
        const a = k / hops, bT = (k + 1) / hops, mid = (a + bT) / 2;
        T(a + 0.02, dx * (1 - a), dy * (1 - a), " scale(1.1,.9)");
        T(mid, dx * (1 - mid), dy * (1 - mid) - h, ` rotate(${dir * 9}deg) scale(.94,1.08)`);
        T(Math.min(0.999, bT - 0.01), dx * (1 - bT), dy * (1 - bT), ` rotate(${-dir * 3}deg) scale(1.14,.86)`);
        const lx = to.left + px / 2 + dx * (1 - bT), ly = to.top + px * (112 / 120) + dy * (1 - bT);
        later(() => puff(lx, ly, k === hops - 1), dur * bT);
      }
      T(1, 0, 0, " scale(1)");
    } else if (style === "loop") {
      dur = Math.min(1500, 900 + d * 0.8); const r = Math.min(46, 26 + d * 0.08);
      for (let i = 0; i <= 16; i++) {
        const t = i / 16; let x = dx * (1 - t), y = dy * (1 - t) - Math.sin(Math.PI * t) * 40;
        if (t > 0.35 && t < 0.75) { const u = (t - 0.35) / 0.4, a = u * Math.PI * 2; x += dir * Math.sin(a) * r; y += -(1 - Math.cos(a)) * r; }
        T(t, x, y, ` rotate(${(t > 0.35 && t < 0.75 ? dir * ((t - 0.35) / 0.4) * 360 : dir * 8 * Math.sin(Math.PI * t)).toFixed(0)}deg)`);
      }
      easing = "ease-in-out";
      for (let i = 1; i < 4; i++) later(() => spawnFx("sparkle", 1), dur * i / 4);
    } else {
      dur = Math.min(1400, 800 + d * 0.9);
      for (let i = 0; i <= 12; i++) { const t = i / 12; T(t, dx * (1 - t), dy * (1 - t) - Math.sin(Math.PI * t) * 36 + Math.sin(t * Math.PI * 4) * 10, ` rotate(${(Math.sin(t * Math.PI * 4) * dir * 10).toFixed(0)}deg)`); }
      easing = "ease-in-out";
      for (let i = 1; i < 4; i++) later(() => spawnFx("sparkle", 1), dur * i / 4);
    }
    fitFrames(frames, to, px);
    const me = travelAnim = box.animate(frames, {duration: dur, easing});
    box.dataset.travel = style;
    motionWatch(dur);
    busyUntil = Math.max(busyUntil, performance.now() + dur + 200);
    followBubble();
    me.onfinish = me.oncancel = () => {
      if (travelAnim !== me) return;
      travelAnim = null; delete box.dataset.travel; clamp("anim-end");
      const b = front && front.querySelector(".cp-bubble.on"); if (b) placeBubble(b);
      if (act && mood === "idle" && !still()) { act.mouth("smile"); later(() => act && mood === "idle" && act.mouth("neutral"), 900); const r = box.getBoundingClientRect(); glanceAt(r.left + (dir > 0 ? -220 : r.width + 220), r.top + r.height * 0.4, 900); }
    };
  }
  // Phones: while a sheet is open or the keyboard is up, the companion stays exactly where it is, whatever circle it is in
  let fullH = 0, fullW = 0;
  function dockFrozen(){
    if (!phone() || !box || !box.dataset.x) return false;
    if (innerWidth !== fullW) { fullW = innerWidth; fullH = 0; }
    const h = Math.max(innerHeight, (window.visualViewport && visualViewport.height) || 0);
    if (h > fullH) fullH = h;
    // a sheet is open, or one just closed and the keyboard is still sliding away
    // or the keyboard is up (typing on the whiteboard or in a note)
    const vv = window.visualViewport;
    if (vv && vv.height < fullH - 100) return true;
    return !!document.querySelector("dialog[open]") || (performance.now() - dlgShut < 800 && h < fullH - 100);
  }
  let dlgShut = -1e9;
  function place(fresh){
    if (!box || !cur) return;
    if (press) return;
    if (dockFrozen()) return;
    const s = choose(!!fresh);
    const prevKind = box.dataset.spot || "";
    const still1 = prevKind === s.kind && ((phone() && (s.kind === "pin" || s.kind === "dock")) || s.kind === "slot") && !travelAnim && !glideAnim;
    home = s.kind === "home" || !box.dataset.x ? "fab" : s.kind;
    spotKind = s.kind;
    document.body.classList.toggle("cp-docked", s.kind === "dock");
    box.hidden = false;
    document.documentElement.style.setProperty("--cp-reserve", s.kind === "home" ? Math.round(s.fab.right - s.left + 12) + "px" : "0px");
    // room under the page's last row, so it can scroll clear of the companion
    document.documentElement.style.setProperty("--cp-pad", s.kind !== "slot" && s.kind !== "dock" && s.top > innerHeight * 0.45 ? Math.round(innerHeight - s.top + 16) + "px" : "0px");
    document.body.classList.toggle("cp-on", true);
    if (box.parentNode !== front) front.appendChild(box);
    box.classList.toggle("cp-h-fab", s.kind === "home");
    const sig = [s.left, s.top, s.px].join(",");
    front.classList.toggle("cp-under", s.kind === "slot");
    anchorFront(s.kind === "slot");
    if (still1) {
      box.style.cssText = `left:${s.left}px;top:${s.top}px;width:${s.px}px;height:${s.px}px`;
      box.dataset.x = s.left; box.dataset.y = s.top; box.dataset.px = s.px; box.dataset.spot = s.kind; homeSig = sig;
      if (s.kind === "pin" || s.kind === "dock") { clamp("place"); fitHitSoon(); }
      return;
    }
    if (sig === homeSig) {
      if (fresh && !still() && !document.hidden && !travelAnim && cur.pose !== "float") { box.animate([{transform: "translateY(0)"}, {transform: "translateY(-12px)", offset: 0.4}, {transform: "translateY(0) scale(1.05,.94)", offset: 0.8}, {transform: "translateY(0)"}], {duration: 420, easing: "ease-out"}); motionWatch(420); }
      else if (fresh && !still() && !document.hidden && !travelAnim) { box.animate([{transform: "translateY(0)"}, {transform: "translateY(-8px)"}, {transform: "translateY(0)"}], {duration: 700, easing: "ease-in-out"}); motionWatch(700); }
      clamp("place"); fitHitSoon();
      return;
    }
    const moving = !!(travelAnim || glideAnim), oldPx = +box.dataset.px || s.px;
    const dc = box.dataset.x && moving ? drawnCentre() : null;
    const from = box.dataset.x ? (dc ? {left: dc.x - s.px / 2, top: dc.y - s.px / 2} : {left: +box.dataset.x, top: +box.dataset.y}) : null;
    const was = box.dataset.x ? {x: +box.dataset.x + oldPx / 2, y: +box.dataset.y + oldPx / 2} : null;
    box.style.cssText = `left:${s.left}px;top:${s.top}px;width:${s.px}px;height:${s.px}px`;
    box.dataset.x = s.left; box.dataset.y = s.top; box.dataset.px = s.px; box.dataset.spot = s.kind;
    if (from && homeSig) {
      if (Math.abs(oldPx - s.px) > 1) { const c = dc || was; stopTravel(); glideBy(c.x - (s.left + s.px / 2), c.y - (s.top + s.px / 2), oldPx / s.px, true); }
      else if (Math.hypot(from.left - s.left, from.top - s.top) >= 6 && !still() && !document.hidden) travel(from, s, s.px);
      else if (Math.hypot(from.left - s.left, from.top - s.top) >= 0.5) { stopTravel(); glideBy(from.left - s.left, from.top - s.top, 0, true); }
    }
    homeSig = sig;
    clamp("place"); fitHitSoon();
    duck();
  }
  let placeT = 0;
  let placeFresh = false;
  let recheckT = [];
  let placeNow = false;
  const placeSoon = (ms, fresh) => {
    if (fresh) placeFresh = true;
    // A placement asked for at once (a tab change) is never pushed back by a later, slower request
    if (placeNow) return;
    clearTimeout(placeT); placeNow = ms === 0;
    placeT = setTimeout(() => {
      placeNow = false;
      passCacheReset(); const f = placeFresh; placeFresh = false; place(f);
      if (f) { recheckT.forEach(clearTimeout); recheckT = [900, 2200].map(t => setTimeout(() => { if (!travelAnim && !press) { passCacheReset(); place(false); } }, t)); }
    }, ms == null ? 250 : ms);
  };
  // In its ring on the Companion page its layer is pinned to the page
  function anchorFront(on){
    if (!front) return;
    if (on) { front.style.position = "absolute"; front.style.inset = "auto"; front.style.left = scrollX + "px"; front.style.top = scrollY + "px"; const de = document.documentElement; front.style.width = de.clientWidth + "px"; front.style.height = de.clientHeight + "px"; }
    else if (front.style.position) ["position", "inset", "left", "top", "width", "height"].forEach(k => front.style.removeProperty(k));
  }
  // Content scrolling under it
  let slotRaf = 0, scrollT = 0;
  addEventListener("scroll", e => {
    // A list scrolling inside a sheet (like the Style Shop) moves nothing under the companion
    const t = e && e.target; if (t && t.nodeType === 1 && t.closest && t.closest("dialog")) return;
    if (spotKind === "slot" && box && !slotRaf) slotRaf = requestAnimationFrame(() => {
      slotRaf = 0;
      const el = document.querySelector(".cpt-face-slot"); if (!el || travelAnim || glideAnim) return;
      const px = +box.dataset.px || sizePx(cur), r = el.getBoundingClientRect(), left = Math.round(r.left + (r.width - px) / 2), top = Math.round(r.top + (r.height - px) / 2 - seatLift(cur, px));
      anchorFront(true); box.style.left = left + "px"; box.style.top = top + "px"; box.dataset.x = left; box.dataset.y = top; homeSig = [left, top, px].join(",");
    });
    // The safety checks wait until scrolling stops, so they never cost a frame mid-scroll
    clearTimeout(scrollT); scrollT = setTimeout(() => { placeSoon(200); guardSoon("scroll", 0); }, 160);
  }, {passive: true, capture: true});
  // A toast that overlaps it
  function duck(){
    if (!box) return;
    const t = document.getElementById("toast"), on = !!(t && t.classList.contains("show"));
    let hit = false;
    if (on) { const a = t.getBoundingClientRect(), b = box.getBoundingClientRect(); hit = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
    box.classList.toggle("cp-duck", hit);
  }
  { const t = document.getElementById("toast"); if (t) new MutationObserver(() => requestAnimationFrame(duck)).observe(t, {attributes: true, attributeFilter: ["class", "style"], childList: true, subtree: true, characterData: true}); }
  { const f = document.getElementById("fab"); if (f) new MutationObserver(() => placeSoon(60)).observe(f, {attributes: true, attributeFilter: ["class", "style", "hidden"]}); }

  function spawnFx(kind, n){
    if (!box || box.hidden || document.hidden) return;
    const fx = box.querySelector(".cp-fx"); if (!fx) return;
    const px = box.offsetWidth || 72, k = px / VB, top = pt(cur.anchors.top) ? cur.anchors.top : [60, 24];
    const art = {
      heart: `<svg viewBox="0 0 20 18"><path d="M10 16.5C4 12.4 1.5 9.2 1.5 5.9A4.2 4.2 0 0 1 10 3.6A4.2 4.2 0 0 1 18.5 5.9C18.5 9.2 16 12.4 10 16.5Z" fill="#FF7A9C" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M5.4 5.6q1-1.6 2.6-1.2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
      sparkle: `<svg viewBox="0 0 20 20"><path d="M10 1.5L12 8L18.5 10L12 12L10 18.5L8 12L1.5 10L8 8Z" fill="#FFD35A" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      z: `<svg viewBox="0 0 20 20"><text x="10" y="16" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="16" fill="#8C87A8" stroke="#fff" stroke-width="3" paint-order="stroke">z</text></svg>`,
      bang: `<svg viewBox="0 0 20 20"><path d="M10 2.5v9" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M10 2.5v9" stroke="#FFD35A" stroke-width="2.6" stroke-linecap="round"/><circle cx="10" cy="16.2" r="2.4" fill="#FFD35A" stroke="${INK}" stroke-width="1.4"/></svg>`
    };
    const small = px < 70;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "cp-pt" + (still() ? " cp-pt-still" : "");
      const size = (kind === "z" ? 13 : rand(11, 16)) * (small ? 0.8 : 1);
      const x = kind === "z" ? (cur.eyes.rx + 14) * k : kind === "bang" ? (cur.eyes.rx + 10) * k : top[0] * k + rand(-px * 0.36, px * 0.36), y = kind === "z" || kind === "bang" ? (cur.eyes.y - 18) * k : top[1] * k + rand(-4, 14);
      s.style.cssText = `left:${f1(x - size / 2)}px;top:${f1(y - size / 2)}px;width:${f1(size)}px;height:${f1(size)}px;--dx:${f1(kind === "bang" ? 0 : rand(-14, 14))}px;--r:${f1(kind === "bang" ? 0 : rand(-20, 20))}deg;animation-delay:${Math.round(i * 110)}ms`;
      s.innerHTML = art[kind] || art.sparkle;
      fx.appendChild(s);
      const kill = () => s.remove();
      s.addEventListener("animationend", kill, {once: true});
      setTimeout(kill, 2600 + i * 110);
    }
  }

  /* Speech bubble */
  let bubbleT = 0, bubbleIdea = null, bubbleAsk = false;
  const order = {};
  /* One shared guard so the companion never says the same line twice in a row */
  function speechGuard(store){
    const KEY = "studyboard:comp:lastline";
    const norm = t => String(t == null ? "" : t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    let st = {all: "", cats: {}};
    try { const v = JSON.parse(store.getItem(KEY) || "null"); if (v && typeof v === "object") st = {all: String(v.all || ""), cats: v.cats && typeof v.cats === "object" ? v.cats : {}}; } catch (e) {}
    const save = () => { try { const k = Object.keys(st.cats); if (k.length > 60) k.slice(0, k.length - 60).forEach(x => delete st.cats[x]); store.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
    const ok = (text, cat) => { const n = norm(text); return !!n && n !== st.all && !(cat && n === st.cats[cat]); };
    const note = (text, cat) => { const n = norm(text); if (!n) return; st.all = n; if (cat) { delete st.cats[cat]; st.cats[cat] = n; } save(); };
    const choose = (list, cat, rnd) => { const c = (list || []).filter(t => ok(t, cat)); return c.length ? c[Math.floor((rnd || Math.random)() * c.length)] : ""; };
    return {norm, ok, note, choose, last: () => st.all, reset: () => { st = {all: "", cats: {}}; save(); }};
  }
  const SPEECH = speechGuard(localStorage);
  const pickedCat = {};
  // Walks the pool in a shuffled order (every line once before any repeats)
  function pickFrom(key, list){
    if (!list || !list.length) return "";
    for (let n = 0; n < list.length + 1; n++) {
      let o = order[key];
      if (!o || !o.q.length) { const q = list.map((_, i) => i).sort(() => Math.random() - 0.5); if (o && q.length > 1 && q[0] === o.last) q.push(q.shift()); o = order[key] = {q, last: o ? o.last : -1}; }
      const i = o.q.shift(); o.last = i;
      if (SPEECH.ok(list[i], key)) { pickedCat[SPEECH.norm(list[i])] = key; return list[i]; }
    }
    return "";
  }
  const ownLines = kind => cur && Array.isArray(cur.lines[kind]) && cur.lines[kind].length ? cur.lines[kind] : GENERIC[kind] || GENERIC.tap;
  const bubbleOpen = () => !!(front && front.querySelector(".cp-bubble.on"));
  function hideBubble(){ clearTimeout(bubbleT); bubbleIdea = null; bubbleAsk = false; if (front) { const b = front.querySelector(".cp-bubble"); if (b) b.classList.remove("on", "has-idea", "asking"); } guardSoon("bubble", 300); }
  let bRects = null, bRectsAt = 0;
  const bubbleRects = () => { const n = performance.now(); if (!bRects || n - bRectsAt > 700) { try { bRects = contentRects(); } catch (e) { bRects = []; } bRectsAt = n; } return bRects; };
  // Where the bubble goes
  function placeBubble(b){
    const r = box.getBoundingClientRect(), g = geometry(), S = safeRect(), cx = r.left + r.width / 2;
    let PL = 4, PR = 14, PT = 14, PB = 8;
    const maxW = Math.max(120, Math.min(phone() ? 300 : 280, S.r - PR - Math.max(S.l, g.side + MARGIN) - PL - 8));
    if (b.dataset.mw !== String(maxW)) { b.style.maxWidth = maxW + "px"; b.dataset.mw = maxW; }
    b.style.width = ""; b.style.left = "0px";
    const w = b.offsetWidth + 1; b.style.width = w + "px";
    const maxH = Math.max(60, Math.floor(S.b - S.t - PT - PB - 16)), mh = b.classList.contains("long") ? Math.min(maxH, Math.round(Math.min(innerHeight * 0.46, 340))) : maxH;
    if (b.dataset.mh !== String(mh)) { b.style.maxHeight = mh + "px"; b.dataset.mh = mh; }
    b.style.overflowY = b.scrollHeight > mh + 1 ? "auto" : "";
    const h = b.offsetHeight;
    const tx = Math.ceil(h / 2 * 0.06), ty = Math.ceil(w / 2 * 0.06); PL += tx; PR += tx; PT += ty; PB += ty;
    const lo = Math.max(S.l, g.side + MARGIN) + PL, hi = S.r - PR;
    const left = Math.max(lo, Math.min(hi - w, cx - w / 2));
    const minT = S.t + PT, maxT = S.b - PB - h;
    let top = r.top + r.height * 0.06 - h;
    const topB = r.bottom + 4;
    const aboveFits = top >= minT, belowFits = topB <= maxT;
    const cover = t => { let a = 0; const x1 = left, x2 = left + w, y2 = t + h; for (const q of bubbleRects()) { const ox = Math.min(x2, q.right) - Math.max(x1, q.left), oy = Math.min(y2, q.bottom) - Math.max(t, q.top); if (ox > 0 && oy > 0) a += ox * oy; } return a; };
    let below = false;
    if (aboveFits && belowFits) below = topB > r.bottom - h * 0.5 && cover(topB) + 400 < cover(top);
    else if (!aboveFits && belowFits) below = true;
    else if (!aboveFits && !belowFits) below = (S.b - r.bottom) > (r.top - S.t);
    if (below) top = topB;
    top = Math.max(minT, Math.min(maxT, top));
    b.classList.toggle("below", below);
    b.style.left = Math.round(left) + "px"; b.style.top = Math.round(top) + "px";
    b.style.setProperty("--tx", Math.round(Math.max(16, Math.min(w - 16, r.left + r.width / 2 - left))) + "px");
  }
  /* Using the student's name */
  function userName(){
    const clean = v => String(v || "").replace(/[^\p{L}\p{M}'\- ]/gu, "").trim().split(/\s+/)[0].slice(0, 20);
    try {
      const md = (typeof sbUser !== "undefined" && sbUser && sbUser.user_metadata) || {};
      const n = clean(md.first_name || md.given_name || md.full_name || md.name);
      if (n) return n;
      if (typeof sbUser !== "undefined" && sbUser) { const g = clean(localStorage.getItem("sb:grpName:" + sbUser.id)); return g; }
      return clean(localStorage.getItem("studyboard:comp:uname"));
    } catch (e) { return ""; }
  }
  // Now and then
  let nameGap = 3;
  function withName(text, opts){
    if (opts.name === false || opts.long || opts.idea || opts.ask || text.length > 70) return text;
    const n = userName(); if (!n || text.toLowerCase().includes(n.toLowerCase())) return text;
    if (--nameGap > 0 || Math.random() > 0.3) return text;
    const m = /^(.*?)([.!?\u2026]+)?$/.exec(text.trim()); if (!m || !m[1]) return text;
    nameGap = 5;
    return `${m[1].replace(/[,;:]$/, "")}, ${n}${m[2] || "."}`;
  }
  // The first time it's out each local day (or right after signing in), it says hello by name
  const HELLO_KEY = "studyboard:comp:helloDay";
  function dailyHello(){
    try {
      if (!talkOn() || !act || !cur || !box || box.hidden || document.hidden || mood !== "idle") return;
      const t = todayISO(), n = userName(); if (!n || localStorage.getItem(HELLO_KEY) === t) return;
      localStorage.setItem(HELLO_KEY, t);
      const h = new Date().getHours();
      const pool = h >= 22 || h < 5 ? [`Still up, ${n}? Let's keep it gentle tonight.`, `Hi ${n}. A little night study?`]
        : h < 11 ? [`Good morning, ${n}!`, `Morning, ${n}! Ready for today?`] : h < 17 ? [`Good afternoon, ${n}!`, `Hi ${n}! Good to see you.`] : [`Good evening, ${n}!`, `Hi ${n}! How was your day?`];
      say(pick(pool), {again: true, name: false});
    } catch (e) {}
  }
  function say(text, opts){
    if (!front || !cur || !box || box.hidden || document.hidden || !text) return;
    opts = opts || {};
    text = withName(text, opts);
    if (!opts.again && !SPEECH.ok(text)) return;
    SPEECH.note(text, opts.cat || pickedCat[SPEECH.norm(text)]);
    const b = front.querySelector(".cp-bubble");
    b.classList.remove("on", "has-idea", "asking", "long", "cheer");
    if (opts && opts.long) b.classList.add("long");
    if (opts.cheer || /^(WOO|YES|YAY|Woohoo|Yay|Hooray)\b/.test(text)) b.classList.add("cheer");
    b.innerHTML = `<span class="cp-b-t"></span>`;
    b.querySelector(".cp-b-t").textContent = text;
    const idea = opts.idea || null, ask = !!opts.ask;
    bubbleIdea = idea; bubbleAsk = ask;
    const btns = [];
    if (idea) btns.push(`<button type="button" class="btn small primary" data-cp="yes">${esc(idea.yes || "Let's Do It")}</button>`, `<button type="button" class="btn small" data-cp="no">Not Now</button>`);
    if (ask) btns.push(`<button type="button" class="btn small cp-ask-btn" data-cp="ask" aria-label="Ask ${esc(nameOf(cur))} something">Ask</button>`);
    if (btns.length) { b.classList.add("has-idea"); b.insertAdjacentHTML("beforeend", `<span class="cp-b-acts">${btns.join("")}</span>`); }
    placeBubble(b);
    void b.offsetWidth; b.classList.add("on");
    guardSoon("bubble", 450);
    clearTimeout(bubbleT);
    bubbleT = setTimeout(hideBubble, opts.ms || (btns.length ? 9000 : Math.max(2600, 1400 + text.length * 55)));
    act.mouth("open"); later(() => { if (act && mood !== "doze" && mood !== "nap") act.mouth(mood === "study" ? "neutral" : "smile"); later(() => { if (act && mood === "idle") act.mouth("neutral"); }, 1400); }, 420);
  }
  /* Ask About This */
  let lastFile = null;
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[data-asset]"); if (!a) return;
    const id = a.dataset.asset, f = Object.values(state.files || {}).find(x => x && (x.revs || []).some(r => r.assetId === id));
    if (f) lastFile = {id: f.id, at: Date.now()};
  }, true);
  const vis = el => !!el && el.offsetParent !== null;
  function screenPeek(){
    try {
      if (ui.tab === "flashcards" && ui.fc && ui.fc.mode === "study") { const it = ui.fc.q[ui.fc.i], d = it && state.decks[it.deckId]; if (d) return {kind: "Flashcard", label: d.name || "Flashcard", hint: `Like "explain this card" or "give me a way to remember it"`}; }
      const ed = document.querySelector(".note.editing[data-note]") || (document.activeElement && document.activeElement.closest && document.activeElement.closest(".note[data-note]"));
      if (ed && state.notes[ed.dataset.note]) { const n = state.notes[ed.dataset.note]; return {kind: "Note", label: (n.text || "Note").split("\n")[0] || "Note", hint: `Like "quiz me on this note" or "explain this simply"`}; }
      if (lastFile && Date.now() - lastFile.at < 30 * 60000 && state.files[lastFile.id] && ui.tab === "files") return {kind: "File", label: state.files[lastFile.id].name || "File", hint: `Like "summarize this reading" or "quiz me on it"`};
      if (ui.tab === "courses" && ui.courseId && state.courses[ui.courseId]) { const c = state.courses[ui.courseId]; return {kind: "Course", label: courseLabel(c), hint: `Like "what's coming up in this course?"`}; }
      if (ui.tab === "notes") return {kind: "Note Board", label: "Your notes", hint: `Like "quiz me on my notes"`};
    } catch (e) {}
    return null;
  }
  const clip = (t, n) => String(t || "").replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n);
  async function screenCtx(){
    const p = screenPeek(); if (!p) return null;
    try {
      if (p.kind === "Flashcard") {
        const it = ui.fc.q[ui.fc.i], d = state.decks[it.deckId], c = d && d.cards.find(x => x.id === it.cardId);
        return c ? Object.assign(p, {text: clip(`Deck: ${d.name}\nFront: ${c.front}\nBack: ${c.back}${ui.fc.flipped ? "" : "\n(The student hasn't flipped the card yet: don't reveal the back unless they ask for the answer.)"}`, 3000)}) : null;
      }
      if (p.kind === "Note") { const ed = document.querySelector(".note.editing[data-note]") || document.activeElement.closest(".note[data-note]"); const n = state.notes[ed.dataset.note]; return Object.assign(p, {text: clip(n.text, 4000)}); }
      if (p.kind === "File") { const f = state.files[lastFile.id]; const t = typeof window.SBFILETEXT === "function" ? await window.SBFILETEXT(f.id, 7000) : ""; return t ? Object.assign(p, {text: clip(t, 7000)}) : Object.assign(p, {text: `(The text inside "${f.name}" couldn't be read. Its name is all that's known.)`}); }
      if (p.kind === "Course") {
        const c = state.courses[ui.courseId], ts = allTasks().filter(t => t.courseId === c.id && t.status !== "done" && t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 12);
        return Object.assign(p, {text: clip(`Course: ${c.name}${c.code ? " (" + c.code + ")" : ""}\nOpen tasks:\n${ts.map(t => `- ${t.title} (${t.type}, due ${t.due}${t.weight ? ", worth " + t.weight + "%" : ""})`).join("\n") || "none"}\nNotes: ${c.notes || ""}`, 4000)});
      }
      if (p.kind === "Note Board") { const ns = Object.values(state.notes || {}).filter(n => n && n.text && !n.wb).slice(0, 25); return Object.assign(p, {text: clip(ns.map(n => "- " + n.text.replace(/\n+/g, " ")).join("\n"), 5000)}); }
    } catch (e) { console.warn("companion screen", e); }
    return null;
  }
  // The task sheet is a window above the page, so Ask About This lives inside it
  function taskCtx(form){
    const g = n => { const el = form.querySelector(`[name="${n}"]`); return el ? el.value : ""; };
    const c = state.courses[g("courseId")];
    const checklist = [...form.querySelectorAll("#clList input[type=text]")].map(i => i.value).filter(Boolean);
    return {kind: "Task", label: g("title") || "This task", text: clip(`Task: ${g("title")}\nType: ${g("type")}\nCourse: ${c ? c.name : "none"}\nDue: ${g("due")} ${g("time")}\nWorth: ${g("weight") ? g("weight") + "%" : "not given"}\nNotes and instructions:\n${g("notes") || "none"}${checklist.length ? "\nChecklist: " + checklist.join("; ") : ""}`, 5000)};
  }
  function addTaskAsk(){
    const form = dlg.open && dlg.querySelector("form.sheet"); if (!form || form.querySelector(".cp-tq") || !form.querySelector('[name="title"]') || !form.querySelector('[name="notes"]')) return;
    if (!isOn() || !cur || !askAvailable()) return;
    const notes = form.querySelector('[name="notes"]'), lab = notes.closest("label") || notes.parentElement;
    lab.insertAdjacentHTML("afterend", `<div class="cp-tq"><button type="button" class="link-btn cp-tq-open">${AI_ICON} Ask ${esc(nameOf(cur))} About This Task</button>
      <div class="cp-tq-box" hidden><div class="cp-tq-row"><input type="text" maxlength="160" placeholder="Like &quot;what is this asking me to do?&quot;" aria-label="Your question about this task" data-noenter><button type="button" class="btn small primary">Ask</button></div><p class="cp-tq-a" aria-live="polite"></p></div></div>`);
    const box = form.querySelector(".cp-tq-box"), inp = box.querySelector("input"), out = box.querySelector(".cp-tq-a"), go = box.querySelector("button");
    form.querySelector(".cp-tq-open").addEventListener("click", () => { box.hidden = !box.hidden; if (!box.hidden) inp.focus(); });
    const ask = async () => {
      const q = inp.value.replace(/\s+/g, " ").trim(); if (!q) return;
      go.disabled = true; out.textContent = "Thinking…";
      const r = await aiAsk(q, taskCtx(form));
      go.disabled = false;
      out.textContent = r && r.answer ? r.answer : (r && r.why) || "I can't think of an answer right now. Try again later?";
    };
    go.addEventListener("click", ask);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ask(); } });
  }
  { const origTF = taskForm; taskForm = function(){ const r = origTF.apply(this, arguments); try { setTimeout(addTaskAsk, 0); } catch (e) {} return r; }; }
  // Ask Me: a tiny question box inside the bubble
  function openAsk(){
    const b = front && front.querySelector(".cp-bubble"); if (!b || !cur) return;
    clearTimeout(bubbleT);
    b.classList.remove("has-idea", "long"); b.classList.add("on", "asking");
    const sc = screenPeek();
    b.innerHTML = `<form class="cp-ask" autocomplete="off"><input type="text" class="cp-ask-in" maxlength="160" placeholder="${sc ? `Ask about this ${esc(sc.kind.toLowerCase())}` : `Ask ${esc(nameOf(cur))} something short`}" aria-label="Your question" data-noenter><button type="submit" class="btn small primary">Ask</button></form>
      ${sc ? `<label class="cp-ask-ctx"><input type="checkbox" class="cp-ctx-on" checked> <span>About this ${esc(sc.kind.toLowerCase())}: <b>${esc(shortT(sc.label, 34))}</b></span></label>` : ""}
      <span class="cp-ask-hint">${sc ? esc(sc.hint) : `Like "what should I do next?" or "quiz me on something"`}</span>`;
    placeBubble(b);
    const f = b.querySelector("form"), i = b.querySelector("input.cp-ask-in");
    f.addEventListener("submit", e => { e.preventDefault(); e.stopPropagation(); const q = i.value.replace(/\s+/g, " ").trim(); const on = b.querySelector(".cp-ctx-on"); if (q) askNow(q, on && on.checked); });
    i.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Escape") hideBubble(); });
    setTimeout(() => i.focus(), 30);
    bubbleT = setTimeout(() => { if (!b.contains(document.activeElement) || !i.value) hideBubble(); }, 30000);
    if (act) { act.eyes("open"); act.look(0.2, -0.4); if (!still() && partSvg(cur.parts.head)) act.motion("headTilt"); }
  }
  async function askNow(q, useScreen){
    const b = front.querySelector(".cp-bubble");
    clearTimeout(bubbleT);
    b.classList.remove("asking");
    b.innerHTML = `<span class="cp-b-t cp-thinking"><i></i><i></i><i></i></span>`;
    placeBubble(b); b.classList.add("on");
    if (act) { hold(4000); act.look(0.5, -0.6); }
    let r = await aiAsk(q, useScreen ? await screenCtx() : null);
    if (!act) return;
    act.look(0, 0);
    if (r && r.answer && !SPEECH.ok(r.answer)) r = {why: pickFrom("ask:same", ["Hmm, I'd say the same thing again! Try asking another way?", "That's my answer again! Want to ask it differently?", "I keep landing on the same answer! Give me a different question?"])};
    if (r && r.answer) { say(r.answer, {idea: r.idea, ms: Math.min(60000, Math.max(14000, 6000 + r.answer.length * 75)), long: r.answer.length > 200}); act.eyes("happy"); later(() => act && act.eyes("open"), 1200); }
    else say(r && r.why ? r.why : "I can't think of an answer right now. Try again later?", {ms: 5000});
  }

  /* Moods: idle, study (a tiny book), doze (sleepy characters during focus), nap */
  function setMood(m){
    mood = m;
    if (!act) return;
    const zzz = m === "doze" || m === "nap";
    act.prop(m === "study" ? "book" : "");
    act.eyes(zzz ? "sleepy" : "open");
    act.mouth(zzz ? "sleepy" : "neutral");
    act.look(0, m === "study" ? 0.8 : 0);
    box.classList.toggle("cp-doze", zzz);
    box.classList.toggle("cp-study", m === "study");
    schedule();
  }
  let busyUntil = 0;
  const busy = () => performance.now() < busyUntil;
  const hold = ms => { busyUntil = Math.max(busyUntil, performance.now() + ms); };

  /* The local brain */
  const BR = {energy: 0.7, input: Date.now(), taskDone: null, lastIdles: [], dayMood: "", attnT: 0, knownTasks: null, taps: 0};
  const clamp01 = v => Math.max(0, Math.min(1, v));
  function baseEnergy(h){ return h < 5 ? 0.18 : h < 7 ? 0.35 : h < 10 ? 0.7 : h < 13 ? 0.9 : h < 15 ? 0.72 : h < 18 ? 0.82 : h < 21 ? 0.62 : h < 23 ? 0.42 : 0.28; }
  const DAY_MOOD = {cheerful: 0.12, calm: 0, cozy: -0.08, proud: 0.1, focused: 0.04, sleepy: -0.15};
  function think(){
    const idleMin = (Date.now() - BR.input) / 60000;
    const running = typeof pomo !== "undefined" && pomo && pomo.running;
    BR.energy = clamp01(baseEnergy(new Date().getHours()) + (DAY_MOOD[BR.dayMood] || 0) - Math.min(0.3, idleMin * 0.03) + (BR.taskDone && Date.now() - BR.taskDone.at < 20 * 60000 ? 0.12 : 0));
    if (mood === "idle" && !running && idleMin >= 4 && !busy()) setMood("nap");
    aiSeen();
    if ((aiRead().queue || []).length) aiFlush();
  }
  let tickT = 0;
  const startTick = () => { clearInterval(tickT); tickT = setInterval(() => { if (!document.hidden && act) { dailyHello(); think(); } }, 60000); };
  function wake(){
    if (mood !== "nap" || !act) return;
    setMood("idle"); hold(1600);
    act.eyes("open"); act.blink(); later(() => act && act.motion("stretch"), 250);
  }
  function noteInput(){ BR.input = Date.now(); if (mood === "nap") wake(); }
  // Glance toward a point on screen for a moment
  function glanceAt(x, y, ms){
    if (!act || !box || box.hidden || (mood !== "idle" && mood !== "break")) return;
    const r = box.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * (cur.eyes.y / VB);
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
    act.look(f1(dx / d), f1(Math.max(-0.6, Math.min(1, dy / d))));
    clearTimeout(BR.attnT); BR.attnT = setTimeout(() => { if (act && !looking && (mood === "idle" || mood === "break")) act.look(0, 0); }, ms || 1600);
  }
  function curious(){
    if (!act || mood !== "idle" || busy() || document.hidden) return;
    hold(1400);
    if (Math.random() < 0.5 && !still()) act.motion(partSvg(cur.parts.head) ? "headTilt" : "bounce");
    else { act.eyes("open"); act.blink(); }
    const v = document.getElementById("view"); if (v) { const r = v.getBoundingClientRect(); glanceAt(r.left + Math.min(r.width, 600) / 2, r.top + 80, 1800); }
  }
  // Idles weighted by energy, never the same one three times in a row
  function nextIdle(){
    const e = BR.energy, opts = [];
    cur.idle.forEach(n => opts.push([n, e < 0.35 ? 0.6 : 2]));
    if (e < 0.35) { opts.push(["yawn", 1.4], ["sway", 1]); }
    else if (e > 0.75) { opts.push(["bounce", 0.9], ["hop", 0.5], ["sparkle", 0.5]); }
    else opts.push(["sway", 0.6], ["glance", 1]);
    opts.push(["glance", 0.8]);
    const pool = opts.filter(([n]) => !(BR.lastIdles[0] === n && BR.lastIdles[1] === n));
    let t = pool.reduce((s, [, w]) => s + w, 0) * Math.random();
    const choice = (pool.find(([, w]) => (t -= w) <= 0) || pool[0])[0];
    BR.lastIdles.unshift(choice); BR.lastIdles.length = 2;
    return choice;
  }
  function doIdle(n){
    if (n === "glance") { const d = Math.random() < 0.5 ? -1 : 1; act.look(d, rand(-0.3, 0.2)); later(() => { if (!looking && mood === "idle") act.look(0, 0); }, 1600); return; }
    if (n === "yawn") { hold(1500); act.eyes("sleepy"); act.mouth("open"); later(() => { if (act && mood === "idle") { act.mouth("neutral"); act.eyes("open"); act.blink(); } }, 1300); return; }
    act.motion(n);
  }
  function schedule(){
    clearTimers();
    if (!act || document.hidden || (box && box.hidden)) return;
    const blink = () => later(() => { act.blink(); if (Math.random() < 0.18) later(() => act.blink(), 260); blink(); }, rand(2600, 6200));
    if (mood !== "doze" && mood !== "nap") blink();
    if (still()) return;
    const gap = () => BR.energy > 0.75 ? rand(7000, 12000) : BR.energy < 0.35 ? rand(12000, 20000) : rand(9000, 15000);
    const idle = () => later(() => {
      if (!act || busy()) return idle();
      if (mood === "idle" || mood === "break") doIdle(nextIdle());
      else if (mood === "study") { if (Math.random() < 0.55) act.motion("flip"); else { act.look(-0.7, 0.8); later(() => act.look(0.7, 0.8), 900); later(() => act.look(0, 0.8), 1900); } }
      idle();
    }, gap());
    idle();
    if (mood === "doze" || mood === "nap") { const zz = () => later(() => { spawnFx("z", 1); zz(); }, rand(3200, 4800)); zz(); }
  }

  function build(){
    const c = current();
    if (!isOn() || !c) { teardown(); return; }
    const sig = [c.id, wearOf(c), JSON.stringify(cfg().tint || {}), pro() ? 1 : 0, nameOf(c)].join("|");
    if (layer && sig === curSig) { applyVars(); placeSoon(0); return; }
    const first = !layer;
    if (!layer) {
      layer = document.createElement("div"); layer.id = "compLayer"; layer.className = "cp-layer";
      document.body.appendChild(layer);
      front = document.createElement("div"); front.id = "compFront"; front.className = "cp-front";
      front.innerHTML = `<div class="cp-bubble" role="status"></div>`;
      document.body.appendChild(front);
      front.querySelector(".cp-bubble").addEventListener("click", onBubbleClick);
    }
    if (act) act.stopAll();
    const keepMood = cur && cur.id === c.id ? mood : null;
    let keepAt = null;
    if (box && box.dataset.x && homeSig) { const o = +box.dataset.px || sizePx(c), dc = travelAnim || glideAnim ? drawnCentre() : {x: +box.dataset.x + o / 2, y: +box.dataset.y + o / 2}; keepAt = {x: dc.x, y: dc.y}; }
    cur = c; curSig = sig; homeSig = "";
    compChanged();
    if (box) { stopTravel(); if (glideAnim) try { glideAnim.cancel(); } catch (e) {} box.remove(); }
    layer.insertAdjacentHTML("beforeend", `<div class="cp cp-${c.pose}" data-id="${esc(c.id)}"><span class="cp-shadow"></span><div class="cp-move"><div class="cp-breathe">${rigSvg(c, {wear: wearOf(c)})}</div></div><div class="cp-fx"></div><div class="cp-hit" tabindex="0" role="button" aria-label="${esc(nameOf(c))}, your study companion. Press to say hi. Press and hold, or right-click, to choose a companion."></div></div>`);
    box = layer.querySelector(".cp"); vext = null;
    { const px0 = sizePx(c); box.style.cssText = `left:0px;top:0px;width:${px0}px;height:${px0}px`; front.appendChild(box);
      if (keepAt) { const l = Math.round(keepAt.x - px0 / 2), t = Math.round(keepAt.y - px0 / 2); box.style.left = l + "px"; box.style.top = t + "px"; box.dataset.x = l; box.dataset.y = t; box.dataset.px = px0; homeSig = [l, t, px0].join(","); } }
    act = actor(c, box, {spawn: spawnFx, watch: motionWatch});
    applyVars();
    place();
    const running = typeof pomo !== "undefined" && pomo && pomo.running;
    setMood(keepMood || (running ? (pomo.mode === "focus" ? (c.sleepy ? "doze" : "study") : "break") : "idle"));
    startTick();
    if (first) { setTimeout(greet, 1500); setTimeout(dailyHello, 2600); setTimeout(() => { welcomeBack(); weekCheck(); aiMaybe("open"); }, 6000); }
  }
  function applyVars(){
    if (!layer || !cur) return;
    [layer, front].forEach(el => { if (!el) return; el.classList.toggle("cp-still", still()); el.classList.toggle("cp-dark", isDarkNow()); el.style.setProperty("--cp-wear", wearColor(cur)); });
  }
  function teardown(){
    clearTimers(); clearInterval(tickT); if (act) act.stopAll();
    if (layer) layer.remove(); if (front) front.remove();
    document.body.classList.remove("cp-on"); document.documentElement.style.removeProperty("--cp-reserve"); document.documentElement.style.removeProperty("--cp-pad");
    layer = front = box = act = cur = null; curSig = ""; home = ""; homeSig = ""; vext = null; shrink = 1;
    compChanged();
  }
  // One place that announces "the companion (or its name/outfit) changed"
  let compNote = null;
  function compChanged(){
    const key = cur ? [cur.id, wearOf(cur), JSON.stringify(cfg().tint || {}), nameOf(cur)].join("|") : "";
    if (key === compNote) return;
    const first = compNote === null; compNote = key;
    try { if (typeof faceSwapNow === "function") faceSwapNow(); } catch (e) {}
    if (first) return;
    try { window.dispatchEvent(new CustomEvent("sb:companion", {detail: {id: cur ? cur.id : "", name: cur ? nameOf(cur) : ""}})); } catch (e) {}
    setTimeout(() => { try { scheduleRender(); } catch (e) {} }, 0);
  }

  /* Reactions */
  let taps = [], lastCheer = 0, lastIdea = 0;
  function react(){
    if (!act) return;
    noteInput();
    if (spotKind === "dock") setTimeout(() => { const b = document.querySelector('nav.tabs .in [data-tab="companion"]'); if (b && spotKind === "dock") b.click(); }, 280);
    const now = Date.now();
    taps = taps.filter(t => now - t < 5000); taps.push(now);
    if (taps.length >= 5) { taps = []; loved(); return; }
    BR.taps++;
    hold(1600);
    const wasMood = mood;
    act.eyes("happy"); act.mouth("smile");
    const r = Math.random();
    if (wasMood === "doze") { act.eyes("open"); act.mouth("open"); act.motion("bounce"); }
    else if (r < 0.4) { act.motion("hop"); spawnFx("heart", 2); }
    else if (r < 0.7) { act.motion(pick(cur.idle)); spawnFx("sparkle", 2); }
    else { act.motion(act.has("armL") || act.has("armR") ? "wave" : "bounce"); spawnFx("heart", 1); }
    if (talkOn()) {
      const idea = wasMood === "idle" && now - lastIdea > 2 * 3600000 && Math.random() < 0.5 ? ideaNow() : null;
      const ask = askAvailable();
      if (idea && SPEECH.ok(idea.text)) { lastIdea = now; say(idea.text, {idea, ask}); }
      else say(tapLine(), {ask});
    }
    later(() => { if (!act) return; act.eyes(mood === "doze" ? "sleepy" : "open"); act.mouth(mood === "doze" ? "sleepy" : "neutral"); }, 1300);
  }
  function loved(){
    hold(2600);
    act.eyes("happy"); act.mouth("smile");
    box.classList.add("cp-loved");
    act.motion(cur.cheer === "hop" ? "spin" : cur.cheer, true);
    later(() => act && act.motion("hop"), 950);
    spawnFx("heart", 5);
    if (talkOn()) say(pickFrom(cur.id + ":pet", ownLines("pet")));
    later(() => { if (!act) return; box.classList.remove("cp-loved"); act.eyes(mood === "doze" ? "sleepy" : "open"); act.mouth(mood === "doze" ? "sleepy" : "neutral"); }, 2600);
  }
  // Celebrations are wordless
  function cheer(kind, delay){
    if (!act || document.hidden) return;
    const now = Date.now(); if (now - lastCheer < 3500) return; lastCheer = now;
    setTimeout(() => {
      if (!act) return;
      if (mood === "nap") wake();
      hold(2200);
      act.eyes("happy"); act.mouth("smile");
      act.motion(cur.cheer, true);
      if (cur.cheer !== "hop") later(() => act && act.motion("hop"), 900);
      spawnFx("sparkle", 4);
      later(() => { if (!act) return; act.eyes(mood === "doze" ? "sleepy" : "open"); act.mouth(mood === "doze" ? "sleepy" : "neutral"); }, 2000);
    }, delay || 0);
  }
  // Greets once per session without words
  function greet(){
    if (!act || document.hidden) return;
    let done = false; try { done = sessionStorage.getItem(GREET_KEY) === "1"; sessionStorage.setItem(GREET_KEY, "1"); } catch (e) {}
    if (done || mood !== "idle") return;
    const h = new Date().getHours();
    hold(2400);
    if (h >= 22 || h < 5) { act.eyes("sleepy"); act.mouth("open"); later(() => act && act.mouth("sleepy"), 700); act.motion("sway"); later(() => { if (act && mood === "idle") { act.eyes("open"); act.mouth("neutral"); } }, 2600); }
    else if (h >= 5 && h < 11) { act.eyes("happy"); act.motion("stretch"); later(() => act && mood === "idle" && act.eyes("open"), 1700); }
    else { act.eyes("happy"); act.mouth("smile"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => { if (act && mood === "idle") { act.eyes("open"); act.mouth("neutral"); } }, 1800); }
    later(checkUnlocks, 5000);
  }
  // A new accessory
  const LEGACY_ACC = ["scarf", "hat", "glasses", "backpack", "star", "cap"];
  let lastUnlockChk = 0;
  function checkIn(){
    try {
      if (document.hidden || !isOn()) return;
      const t = todayISO(), ci = cfg().ci || [];
      if (ci[ci.length - 1] === t) return;
      setCfg({ci: ci.concat(t).slice(-400)});
      pStat = null;
    } catch (e) {}
  }
  function checkUnlocks(){
    lastUnlockChk = Date.now();
    checkIn();
    const have = cfg().earned, seen = Number(cfg().seen);
    const earnedNow = ACC.filter(isEarned);
    if (!have) {
      const quiet = earnedNow.filter(a => !LEGACY_ACC.includes(a.id) || !Number.isFinite(seen) || LEGACY_ACC.indexOf(a.id) < seen);
      setCfg({earned: Object.fromEntries(quiet.map(a => [a.id, 1]))});
      if (!Number.isFinite(seen) && !quiet.length) return;
      if (earnedNow.length === quiet.length) return;
    }
    const got = cfg().earned || {};
    const fresh = earnedNow.filter(a => !got[a.id]);
    if (!fresh.length) return;
    setCfg({earned: Object.fromEntries(fresh.map(a => [a.id, Date.now()]))});
    if (!act || !cur) return;
    const wearable = fresh.filter(canWear), a = wearable[wearable.length - 1] || fresh[fresh.length - 1];
    if (a && canWear(a) && !wearOf(cur).length) setCfg({wear: {[cur.id]: [a.id]}});
    build();
    hold(2200);
    act.eyes("happy"); act.motion("hop"); spawnFx("sparkle", 5);
    if (talkOn()) say(fresh.length > 1 ? `Ooh, ${fresh.length} new props: ${fresh.map(x => x.name).join(", ")}! Look in my wardrobe!` : `Ooh, a new prop: the ${a.name}! Thanks for working so hard!`);
    later(() => act && act.eyes(mood === "doze" ? "sleepy" : "open"), 2000);
    try { refreshPicker(); } catch (e) {}
  }
  // Checked as you go (not only at the daily hello)
  hook("render", () => { if (Date.now() - lastUnlockChk > 20000 && !document.hidden) setTimeout(checkUnlocks, 1500); });

  /* What to say on a tap */
  const shortT = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > (n || 26) ? s.slice(0, (n || 26) - 1).replace(/\s+\S*$/, "") + "..." : s; };
  // Spoken lines only name a task when the whole title fits
  const fitsT = (s, n) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > 0 && t.length <= (n || 26); };
  const cleanT = s => String(s || "").replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  const openTasks = () => tasksArr().filter(t => t.status !== "done");
  function nearExam(days){
    const today = todayISO(), lim = addDays(today, days);
    return openTasks().filter(t => t.due && t.due >= today && t.due <= lim && /exam|quiz|test|midterm|final/i.test(t.type + " " + t.title)).sort((a, b) => a.due < b.due ? -1 : 1)[0] || null;
  }
  const streakN = () => { try { return shownStreak().cur || 0; } catch (e) { return 0; } };
  const focusToday = () => { try { return typeof SBSTATS !== "undefined" ? SBSTATS.focusMinutes(todayISO(), todayISO()) : 0; } catch (e) { return 0; } };
  function contextKinds(){
    const h = new Date().getHours(), k = [];
    if (typeof pomo !== "undefined" && pomo && pomo.running && pomo.mode === "focus") k.push("focus");
    if (BR.taskDone && Date.now() - BR.taskDone.at < 30 * 60000) k.push("task");
    if (nearExam(3)) k.push("exam");
    if (streakN() >= 2) k.push("streak");
    if (h >= 22 || h < 5 || focusToday() >= 180) k.push("rest");
    if (h >= 5 && h < 11) k.push("morning");
    if (h >= 18) k.push("evening");
    return k;
  }
  function memoryLines(){
    const out = [], n = streakN(), f = focusToday(), done = BR.taskDone, ex = nearExam(3);
    if (done && Date.now() - done.at < 30 * 60000) { if (fitsT(done.title)) out.push(`Woohoo! ${cleanT(done.title)} is done!`); }
    else {
      const y = addDays(todayISO(), -1);
      const t = tasksArr().find(x => x.status === "done" && x.doneAt && iso(new Date(x.doneAt)) === y);
      if (t && fitsT(t.title)) out.push(`You finished ${cleanT(t.title)} yesterday! Still proud!`);
    }
    if (n >= 2) out.push(`${n} days in a row! You're on a roll!`);
    if (f >= 60) out.push(`${Math.round(f / 6) / 10} hours of focus today! Amazing!`);
    if (ex) out.push(fitsT(ex.title, 22) ? `${cleanT(ex.title)} soon! You've totally got this!` : `Your ${/quiz/i.test((ex.type || "") + ex.title) ? "quiz" : "exam"} is coming up! You've got this!`);
    return out.filter(s => s.length <= 60);
  }
  let helloSaid = false;
  // Never the same line as last time
  function tapLine(){
    for (let n = 0; n < 8; n++) { const t = tapLineRaw(); if (t && SPEECH.ok(t)) return t; }
    for (const k of ["tap", "hello", "morning", "night", "pet", "done"]) { const t = pickFrom(cur.id + ":" + k, ownLines(k)); if (t) return t; }
    return "";
  }
  function tapLineRaw(){
    const m = momentLine(); if (m) return m;
    const plan = aiPlan(), kinds = contextKinds();
    if (plan) {
      const special = plan.lines.filter(l => l.trigger !== "tap" && kinds.includes(l.trigger)).map(l => l.text);
      const general = plan.lines.filter(l => l.trigger === "tap").map(l => l.text);
      if (special.length && Math.random() < 0.55) return pickFrom("ai:s", special);
      if (general.length && Math.random() < 0.6) return pickFrom("ai:g", general);
    }
    if (mood === "study" || mood === "doze") return pickFrom(cur.id + ":focus", ownLines("focus"));
    if (mood === "break") return pickFrom(cur.id + ":break", ownLines("break"));
    if (!helloSaid) { helloSaid = true; return pickFrom(cur.id + ":hello", ownLines("hello")); }
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 11 && Math.random() < 0.3) return pickFrom(cur.id + ":morning", ownLines("morning"));
    const mem = memoryLines();
    if (mem.length && Math.random() < 0.35) return pickFrom("mem", mem);
    const h = new Date().getHours();
    if ((h >= 22 || h < 5) && Math.random() < 0.4) return pickFrom(cur.id + ":night", ownLines("night"));
    return pickFrom(cur.id + ":tap", ownLines("tap"));
  }
  // An idea to offer after a tap (never pushed)
  function ideaNow(){
    if (typeof pomo !== "undefined" && pomo && pomo.running) return null;
    if (dismissedIdea()) return null;
    const plan = aiPlan();
    const est = estIdea(); if (est) return est;
    if (plan && plan.idea) { const i = plan.idea; if (ideaValid(i)) return i; }
    try {
      const F = FOCUS || computeFocus(), top = F && F.ranked && F.ranked.find(x => x.alloc > 0 && x.t.status !== "done" && canDoNow(x.t));
      if (top) return {text: fitsT(top.t.title, 30) ? `I picked ${cleanT(top.t.title)} for you! Focus on it together?` : "I picked your next task! Want to focus on it together?", action: "focus", taskId: top.t.id, local: true};
      const n = allDueCount(); if (n >= 5) return {text: `${n} flashcards are ready! Review them together?`, action: "review", local: true};
    } catch (e) {}
    return null;
  }
  // Tasks due in the next 2 weeks with no time estimate
  const EST_KEY = "studyboard:comp:est";
  const estCount = () => { try { return typeof SBEST !== "undefined" && SBEST ? SBEST.count() : 0; } catch (e) { return 0; } };
  const estAsked = () => { try { return localStorage.getItem(EST_KEY) === todayISO(); } catch (e) { return false; } };
  const estMark = () => { try { localStorage.setItem(EST_KEY, todayISO()); } catch (e) {} };
  function estIdea(force){
    const n = estCount(); if (!n || (estAsked() && !force)) return null;
    return {text: n === 1 ? "Ooh, one task due soon needs a time estimate! Want to add it together?" : `${n} tasks due soon need time estimates! Want to add them together? It's quick!`, action: "estimate", yes: "Add Times", local: true};
  }
  function ideaValid(i){
    if (!i) return false;
    if (i.action === "estimate") return estCount() > 0;
    if (i.action === "semester") return !!(window.SBSEM && SBSEM.ideaValid());
    if (i.action === "crunch") return !!(window.SBCRUNCH && SBCRUNCH.valid(i.week));
    if (i.action === "prep") return !!(window.SBPREP && SBPREP.ideaValid(i.taskId));
    if (i.action === "exam") return !!(window.SBEXAM && SBEXAM.ideaValid(i.taskId));
    if (i.action === "focus") return !!(i.taskId && state.tasks[i.taskId] && state.tasks[i.taskId].status !== "done" && canDoNow(state.tasks[i.taskId]));
    if (i.action === "review") { try { return allDueCount() > 0; } catch (e) { return false; } }
    return false;
  }
  const IDEA_KEY = "studyboard:comp:idea";
  const dismissedIdea = () => { try { return localStorage.getItem(IDEA_KEY) === todayISO(); } catch (e) { return false; } };
  function runIdea(i){
    hideBubble();
    if (!i || !ideaValid(i)) return;
    if (i.action === "estimate") { estMark(); try { SBEST.open(false); } catch (e) { console.warn("companion idea", e); } }
    else if (i.action === "semester") { try { SBSEM.runIdea(); } catch (e) { console.warn("companion idea", e); } }
    else if (i.action === "crunch") { try { SBCRUNCH.openWeek(i.week, {focus: true}); } catch (e) { console.warn("companion idea", e); } }
    else if (i.action === "prep") { try { SBPREP.runIdea(i.taskId); } catch (e) { console.warn("companion idea", e); } }
    else if (i.action === "exam") { try { SBEXAM.study(i.taskId); } catch (e) { console.warn("companion idea", e); } }
    else if (i.action === "focus") { try { openPomo(i.taskId); } catch (e) { console.warn("companion idea", e); } }
    else if (i.action === "review") { try { startStudy(decksArr().filter(d => d.cards.some(cardDue)).map(d => d.id)); } catch (e) { ui.tab = "flashcards"; render(); } }
    if (act) { act.eyes("happy"); act.motion("hop"); later(() => act && act.eyes(mood === "doze" ? "sleepy" : "open"), 1200); }
  }
  function onBubbleClick(e){
    const b = e.target.closest("[data-cp]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const i = bubbleIdea;
    if (b.dataset.cp === "ask") { openAsk(); return; }
    if (b.dataset.cp === "yes") runIdea(i);
    else { try { if (i && i.action === "estimate") estMark(); else if (i && i.action === "crunch") SBCRUNCH.dismiss(i.week); else localStorage.setItem(IDEA_KEY, todayISO()); } catch (err) {} hideBubble(); if (act) { act.eyes("happy"); later(() => act && act.eyes("open"), 900); } }
  }

  /* The AI layer (optional) */
  const AI_KEY = "studyboard:comp:ai", LITE_MAX = 50, PAID_MAX = 4, GAP_MS = 2 * 60000;
  const LITE = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"].filter(m => typeof AI_MODELS === "undefined" || AI_MODELS.includes(m));
  const TRIGGERS = ["tap", "focus", "task", "morning", "evening", "exam", "streak", "rest"];
  const ABOUT = ["task", "focus", "welcome", "exam", "week", "tap"];
  const MOODS = Object.keys(DAY_MOOD);
  const aiRead = () => { try { const s = JSON.parse(localStorage.getItem(AI_KEY) || "{}"); return s && typeof s === "object" ? s : {}; } catch (e) { return {}; } };
  const aiWrite = s => { try { localStorage.setItem(AI_KEY, JSON.stringify(s)); } catch (e) {} };
  const today0 = s => { const d = todayISO(); if (s.day !== d) { s.day = d; s.n = 0; s.used = {}; } return s; };
  let awayMs = (() => { const s = aiRead(); return s.seen ? Date.now() - s.seen : Infinity; })();
  function aiSeen(){ const s = aiRead(); s.seen = Date.now(); aiWrite(s); }
  addEventListener("pagehide", aiSeen);
  const smartOn = () => cfg().ai !== false;
  function aiMode(){
    try {
      if (!smartOn()) return "";
      const a = autoState(); if (!a.on) return "";
      return a.cfg && a.cfg.provider === "gemini" && isFreeModel(a.cfg.provider, a.cfg.model) && a.cfg.key && LITE.length ? "lite" : "paid";
    } catch (e) { return ""; }
  }
  const autoOn = () => { try { return !!autoState().on; } catch (e) { return false; } };
  const aiMax = () => aiMode() === "paid" ? PAID_MAX : LITE_MAX;
  const aiPaused = s => (s.pauseUntil || 0) > Date.now();
  function aiRoom(s, gap){
    if (!isOn() || !cur || document.hidden || navigator.onLine === false) return false;
    const m = aiMode(); if (!m) return false;
    today0(s);
    if (aiPaused(s) || (s.n || 0) >= aiMax()) return false;
    if (Date.now() - (s.last || 0) < gap) return false;
    return m;
  }
  function aiPlan(){
    const s = aiRead(), p = s.plan;
    if (!p || p.day !== todayISO() || !cur || p.comp !== cur.id || !smartOn()) return null;
    return p;
  }
  const BAD = /\b(fail\w*|lazy|stupid|dumb|disappoint\w*|should have|behind|blood|needle\w*|inject\w*|patient\w*|diagnos\w*|death|die|dying|kill\w*|suicid\w*|shame\w*|guilt\w*|hate|worthless|weight|diet)\b/i;
  const BAD_ASK = /\b(stupid|dumb|lazy|worthless|shame\w*|guilt\w*|hate|suicid\w*|kill yourself)\b/i;
  function cleanLine(s, max, bad){
    if (typeof s !== "string") return "";
    let t = s.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s*[‒-―]\s*/g, ", ").replace(/^\s*[-*•]+\s*/, "").replace(/\s+/g, " ").trim().replace(/^["'“‘]+|["'”’]+$/g, "").trim();
    if (!t || t.length > (max || 60)) return "";
    if (/https?:|www\.|[<>{}`\\]|\*\*/.test(t) || (bad || BAD).test(t)) return "";
    t = t.replace(/!{2,}/g, "!");
    if ((t.match(/!/g) || []).length > 3 || /\.\.\.|…|[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(t)) return "";
    return t;
  }
  function cleanIdea(d, refs){
    if (!d || typeof d !== "object" || (d.action !== "focus" && d.action !== "review")) return null;
    const text = cleanLine(d.text, 70), taskId = d.action === "focus" ? refs[String(d.ref || "").trim()] : null;
    return text && (d.action === "review" || taskId) ? {text, action: d.action, taskId} : null;
  }
  function cleanPlan(d, refs){
    if (!d || typeof d !== "object") return null;
    const seen = new Set(), lines = [];
    (Array.isArray(d.lines) ? d.lines : []).forEach(l => {
      if (!l || !TRIGGERS.includes(l.trigger)) return;
      const t = cleanLine(l.text, 60); if (!t || seen.has(t.toLowerCase())) return;
      seen.add(t.toLowerCase()); lines.push({trigger: l.trigger, text: t});
    });
    if (lines.length < 3) return null;
    return {mood: MOODS.includes(d.mood) ? d.mood : "calm", lines: lines.slice(0, 14), idea: cleanIdea(d.idea, refs)};
  }
  function cleanPack(d){
    if (!d || typeof d !== "object") return [];
    const seen = new Set(), out = [];
    (Array.isArray(d.lines) ? d.lines : []).forEach(l => {
      if (!l || !ABOUT.includes(l.about)) return;
      const t = cleanLine(l.text, 60); if (!t || seen.has(t.toLowerCase())) return;
      seen.add(t.toLowerCase()); out.push({about: l.about, text: t});
    });
    return out.slice(0, 10);
  }
  const PLAN_SCHEMA = {type: "OBJECT", properties: {
    mood: {type: "STRING", enum: MOODS, description: "The companion's mood for today"},
    lines: {type: "ARRAY", description: "8 to 12 short lines", items: {type: "OBJECT", properties: {trigger: {type: "STRING", enum: TRIGGERS}, text: {type: "STRING", description: "Under 60 characters, in character"}}, required: ["trigger", "text"]}},
    idea: {type: "OBJECT", description: "Optional: one small thing to offer if the student taps the companion", properties: {text: {type: "STRING", description: "A question under 70 characters"}, action: {type: "STRING", enum: ["focus", "review", "none"]}, ref: {type: "STRING", description: "t1, t2 or t3 for a focus idea"}}}
  }, required: ["mood", "lines"]};
  const PACK_SCHEMA = {type: "OBJECT", properties: {
    lines: {type: "ARRAY", description: "2 short lines for each moment listed, plus 3 fresh tap lines if asked", items: {type: "OBJECT", properties: {about: {type: "STRING", enum: ABOUT}, text: {type: "STRING", description: "Under 60 characters, in character"}}, required: ["about", "text"]}}
  }, required: ["lines"]};
  const ASK_SCREEN_SCHEMA = {type: "OBJECT", properties: {
    answer: {type: "STRING", description: "A clear answer about what's on screen, 1 to 4 short sentences, under 600 characters"},
    action: {type: "STRING", enum: ["focus", "review", "none"]},
    ref: {type: "STRING"}
  }, required: ["answer"]};
  const ASK_SCHEMA = {type: "OBJECT", properties: {
    answer: {type: "STRING", description: "One or two short sentences, under 200 characters, in character"},
    action: {type: "STRING", enum: ["focus", "review", "none"], description: "Offer to start a focus on a task (with ref) or a flashcard review, only if it answers the question"},
    ref: {type: "STRING", description: "t1, t2 or t3 for a focus action"}
  }, required: ["answer"]};
  // The small, privacy-minded summary
  function aiSummary(){
    const now = new Date(), h = now.getHours(), today = todayISO(), week = addDays(today, 7);
    const open = openTasks();
    const dueToday = open.filter(t => t.due === today).length, dueWeek = open.filter(t => t.due && t.due >= today && t.due <= week).length, overdue = open.filter(t => t.due && t.due < today).length;
    const next = open.filter(t => t.due && t.due >= today).sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : 0).slice(0, 3);
    const refs = {};
    const nextLines = next.map((t, i) => { refs["t" + (i + 1)] = t.id; const c = courseOf(t.courseId); return `t${i + 1} | ${shortT(t.title, 60)} | ${c ? shortT(courseLabel(c), 24) : "no course"} | ${t.type || "task"} | due ${t.due}`; });
    const since = Date.now() - 2 * 864e5;
    const recent = tasksArr().filter(t => t.status === "done" && t.doneAt && t.doneAt >= since).sort((a, b) => b.doneAt - a.doneAt).slice(0, 3).map(t => shortT(t.title, 50));
    let week7 = 0; try { week7 = SBSTATS.focusMinutes(addDays(today, -6), today); } catch (e) {}
    const ex = nearExam(14);
    const part = h < 5 ? "late night" : h < 11 ? "morning" : h < 14 ? "midday" : h < 18 ? "afternoon" : h < 22 ? "evening" : "late night";
    const skin = SKINS.find(s => s.id === skinId());
    const text = [
      `Time: ${now.toLocaleDateString("en-US", {weekday: "long"})}, ${part} (${pad(h)}:00).`,
      `Companion: ${nameOf(cur)}, a ${cur.kind || "little friend"} in the ${skin ? skin.name : "plain"} theme. Personality: ${cur.bio || ""} Its usual lines sound like: ${ownLines("tap").slice(0, 3).join(" / ")}`,
      `Tasks: ${dueToday} due today, ${dueWeek} due in the next 7 days, ${overdue} overdue.`,
      `Next deadlines:\n${nextLines.join("\n") || "none"}`,
      `Finished in the last 2 days: ${recent.join("; ") || "nothing yet"}.`,
      `Study streak: ${streakN()} days. Focus today: ${focusToday()} min. Focus this week: ${week7} min.`,
      `Nearest exam or quiz: ${ex ? `${shortT(ex.title, 50)} in ${Math.max(0, Math.round((parse(ex.due) - parse(today)) / 864e5))} days` : "none in the next 2 weeks"}.`
    ].join("\n");
    return {text, refs, dueWeek};
  }
  const VOICE = `You are the voice of a small, cute study companion character who lives in a student planner app used by students of all subjects. You get a summary of the student's day and the character's personality. Reply with JSON only.
Rules for every line: natural spoken English with lots of genuine enthusiasm, like the student's biggest, most excited fan. Bubbly, upbeat and celebratory, with the character's personality and its own little sounds where they fit (one per line at most). Exclamation marks are welcome (one or two per line). Celebrate finished work BIG. During focus sessions and late at night, stay excited but softer. Short and clear: every line must make sense on its own, with no inside jokes, no strained or forced puns (a light pun only if it lands instantly), no slang or meme speak, no baby talk, no flirting. Keep it friendly and clean: nothing sexual or suggestive (no double meanings), no insults or teasing the student, no stereotypes, nothing about alcohol, drugs, violence or death. Never nag, never guilt, never mention failing, being behind, grades or weight. No em dashes or en dashes, no ellipses, no lists, no emoji, no quotes, plain text only.
Good examples: "WOO! That's one off the list!" "Bio quiz tomorrow! Quick card round together?" "Good morning! Let's make today awesome!" "Go go go! I'm cheering right here!" "It's late! Rest is a win too."`;
  const PLAN_SYSTEM = VOICE + `
Write 8 to 12 short lines, each tagged with when to say it: tap (any time the student taps it), focus (during a focus session), task (just after finishing a task), morning, evening, exam (an exam or quiz is close), streak (the student has a study streak), rest (late at night or after lots of focus: gently suggest a break or sleep). Each under 60 characters, specific to the summary when it helps ("Bio quiz tomorrow. Want a quick card round?"). Nothing clinical or medical (no patients, blood, needles, illness). Pick a mood for the day. Optionally offer one small idea the student could say yes to: a focus session on one of the next deadlines (action "focus" with its ref, like t1), or reviewing flashcards (action "review"); use "none" if nothing fits.`;
  const PACK_SYSTEM = VOICE + `
Write lines for the moments listed under "Moments", 2 lines for each, tagged with its "about" value. Each under 60 characters and specific to the moment (name the finished task in a friendly short way, like "Bio cards DONE! That was a big one!"). Nothing clinical or medical.`;
  const ASK_SYSTEM = VOICE + `
The student typed a short question to the companion. Answer in one or two short sentences, under 200 characters, in character and full of excitement to help. Use the summary for questions about what to do next (suggest one of the next deadlines, and set action "focus" with its ref, or "review" for flashcards). If they ask to be quizzed, ask one short study question that fits one of their courses or deadlines, and don't give the answer yet. Be accurate and gentle; for anything about their health, safety or real clinical decisions, kindly suggest they talk to their instructor or a professional. Don't make things up about their schedule. If a block "FOUND IN THEIR FILES, NOTES AND CARDS" is given, answer questions about their files, notes, flashcards or course material from it, and say so if it does not have the answer (up to 3 short sentences, under 380 characters, for those).`;

  const ASK_SCREEN_SYSTEM = VOICE + `
The student is asking about what's on their screen in Studyboard (a flashcard, a task, a note, a file, or a page), shown between triple quotes. Answer about that content: explain it simply, summarize it, say what an assignment is asking for, or (if they ask to be quizzed) ask one short question about it without giving the answer. Plain sentences, up to 4, under 600 characters, still warm and in character but clear first. Be accurate. Only use what's shown plus well-established general knowledge; if the screen doesn't say, tell them to check with their instructor or the course materials. For anything about real patients, medication doses for a real person, or their own health, kindly suggest they talk to their instructor or a professional. Never invent due dates, marks or rubric details.`;
  // The free-tier call
  async function liteCall({system, text, schema, maxTokens}){
    const a = autoState(), key = a && a.cfg && a.cfg.keys && a.cfg.keys.gemini;
    if (!key) throw aiErr("nokey", "No Gemini key");
    let limited = 0, daily = false, lastErr = null;
    for (const m of LITE) {
      let res;
      try {
        res = await fetchT(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": key},
          body: JSON.stringify({contents: [{role: "user", parts: [{text}]}], systemInstruction: {parts: [{text: system}]}, generationConfig: {responseMimeType: "application/json", responseSchema: schema, temperature: 0.8, maxOutputTokens: maxTokens || 1500}})}, 30000);
      } catch (e) { throw aiErr("offline", "offline"); }
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        const cand = j.candidates && j.candidates[0];
        const data = cand ? aiParseJson(((cand.content && cand.content.parts) || []).filter(p => !p.thought).map(p => p.text || "").join("")) : null;
        if (data) return {data, model: m};
        lastErr = aiErr("bad", "garbled"); continue;
      }
      const msg = await errMsg(res);
      if (res.status === 429) { limited++; if (/day|daily|per ?day|quota/i.test(msg)) daily = true; continue; }
      if (res.status === 401 || res.status === 403) throw aiErr("key", "key");
      lastErr = aiErr(res.status >= 500 ? "busy" : "http", msg || String(res.status));
    }
    if (limited) throw Object.assign(aiErr("limit", "limit"), {daily});
    throw lastErr || aiErr("http", "failed");
  }
  // One call, counted against the companion's own budget
  let aiBusy = false;
  async function aiRun(kind, build){
    const s = aiRead(), mode = aiRoom(s, kind === "ask" ? 0 : GAP_MS);
    if (!mode || aiBusy) return null;
    if (mode === "paid" && kind !== "plan") return null;
    if (mode === "paid") { try { if (autoBudget(true) <= 0) return null; AUTO.n = (AUTO.n || 0) + 1; autoSave(); } catch (e) { return null; } }
    s.n = (s.n || 0) + 1; s.last = Date.now(); s.calls = (s.calls || []).concat({at: Date.now(), kind}).slice(-60); aiWrite(s);
    aiBusy = true;
    const req = build();
    try {
      const r = mode === "lite" ? await liteCall(req) : await aiCall({task: "rewrite", auto: true, fast: true, maxTokens: req.maxTokens || 2000, temperature: 0.8, schema: req.schema, system: req.system, parts: [{text: req.text}]});
      const s2 = aiRead(); delete s2.err; s2.model = r && r.model; aiWrite(s2);
      return r && r.data;
    } catch (e) {
      const s2 = aiRead(); s2.err = (e && e.code) || "error";
      if (e && e.code === "limit") { const t = new Date(); t.setHours(24, 5, 0, 0); s2.pauseUntil = e.daily ? t.getTime() : Date.now() + 15 * 60000; }
      if (e && e.code === "key") s2.pauseUntil = Date.now() + 6 * 3600000;
      aiWrite(s2);
      return null;
    } finally { aiBusy = false; }
  }
  // The day plan
  async function aiMaybe(reason, force){
    if (!cur || !aiMode()) return false;
    const s = aiRead(), today = todayISO(), now = Date.now();
    const fresh = s.plan && s.plan.day === today && s.plan.comp === cur.id;
    const back = awayMs >= 3 * 3600000;
    if (fresh && !force && !(back && now - (s.plan.at || 0) >= 3 * 3600000)) return aiFlush();
    if (aiMode() === "paid" && s.plan && s.plan.day === today && now - (s.plan.at || 0) < 3600000) return false;
    const comp = cur.id; let sum;
    const d = await aiRun("plan", () => { sum = aiSummary(); return {system: PLAN_SYSTEM, text: sum.text, schema: PLAN_SCHEMA, maxTokens: 2000}; });
    awayMs = 0;
    const plan = d ? cleanPlan(d, sum.refs) : null;
    const s2 = aiRead();
    if (plan) { s2.plan = Object.assign(plan, {day: today, at: Date.now(), comp}); BR.dayMood = plan.mood; }
    else if (d) s2.err = "bad";
    aiWrite(s2);
    return !!plan;
  }
  // Moments waiting for lines; one call writes lines for all of them
  const MOMENT_TTL = {task: 45 * 60000, focus: 45 * 60000, welcome: 40 * 60000, exam: 12 * 3600000, week: 12 * 3600000, tap: 12 * 3600000};
  function queueMoment(m){
    if (!aiMode() || aiMode() === "paid") return;
    const s = aiRead(); s.queue = (s.queue || []).filter(x => x.about !== m.about).concat(Object.assign({at: Date.now()}, m)).slice(-6); aiWrite(s);
    later(aiFlush, 1500);
  }
  async function aiFlush(){
    const s = aiRead();
    const q = (s.queue || []).filter(x => Date.now() - x.at < (MOMENT_TTL[x.about] || 3600000));
    if (!q.length || !cur) return false;
    let sum;
    const comp = cur.id;
    const d = await aiRun("pack", () => { sum = aiSummary(); const moments = q.map(x => `- ${x.about}: ${x.detail || ""}`).join("\n"); return {system: PACK_SYSTEM, text: `${sum.text}\n\nMoments:\n${moments}`, schema: PACK_SCHEMA, maxTokens: 1200}; });
    if (!d) return false;
    const want = new Set(q.map(x => x.about).concat("tap"));
    const lines = cleanPack(d).filter(l => want.has(l.about));
    const s2 = aiRead();
    s2.queue = (s2.queue || []).filter(x => !q.some(y => y.about === x.about && y.at === x.at));
    s2.moments = (s2.moments || []).filter(x => Date.now() - x.at < (MOMENT_TTL[x.about] || 3600000)).concat(lines.map(l => Object.assign({at: Date.now(), comp}, l))).slice(-30);
    aiWrite(s2);
    return lines.length > 0;
  }
  // A fresh, unused moment line for right now
  function momentLine(){
    const s = aiRead(); if (!cur || !smartOn()) return "";
    const pri = ["task", "focus", "welcome", "exam", "week", "tap"];
    const fresh = (s.moments || []).filter(x => x.comp === cur.id && !x.used && Date.now() - x.at < (MOMENT_TTL[x.about] || 3600000));
    fresh.sort((a, b) => (b.at - a.at) || (pri.indexOf(a.about) - pri.indexOf(b.about)));
    const pickL = fresh.find(x => x.about !== "tap") || (Math.random() < 0.5 ? fresh.find(x => x.about === "tap") : null);
    if (!pickL) return "";
    (s.moments || []).forEach(x => { if (x === pickL || (pickL.about !== "tap" && x.about === pickL.about && x.at === pickL.at)) x.used = true; });
    aiWrite(s);
    if (fresh.filter(x => x.about === "tap" && !x.used).length < 2) later(() => { const s3 = aiRead(); if (!(s3.queue || []).some(x => x.about === "tap")) queueMoment({about: "tap", detail: "a few fresh tap lines for later today"}); }, 800);
    return SPEECH.ok(pickL.text) ? pickL.text : "";
  }
  // Ask Me
  const askAvailable = () => { const s = aiRead(); return aiMode() === "lite" && !aiPaused(s) && (today0(s).n || 0) < LITE_MAX && navigator.onLine !== false; };
  async function aiAsk(q, sc){
    const clean = String(q).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
    if (!clean) return null;
    if (!askAvailable()) return {why: aiPaused(aiRead()) ? "I'm out of answers for today. Ask me again tomorrow?" : "Ask Me needs Smart Lines and a free Gemini key."};
    const s0 = aiRead();
    if (Date.now() - (s0.lastAsk || 0) < 8000) return {why: "One sec, I'm still thinking. Ask again in a moment?"};
    for (let i = 0; aiBusy && i < 80; i++) await new Promise(r => setTimeout(r, 250));
    { const s1 = aiRead(); s1.lastAsk = Date.now(); aiWrite(s1); }
    let sum;
    const screen = sc && sc.text ? `\n\nOn the student's screen right now (${sc.kind}: ${sc.label}):\n"""\n${sc.text}\n"""` : "";
    let found = ""; if (!screen) { try { const R = window.SBSEARCH ? await SBSEARCH.retrieve(clean, {max: 4, chars: 800, readWait: 3}) : null; if (R && R.text) found = `\n\nFOUND IN THEIR FILES, NOTES AND CARDS:\n"""\n${R.text}\n"""`; } catch (e) {} }
    const d = await aiRun("ask", () => { sum = aiSummary(); return {system: screen ? ASK_SCREEN_SYSTEM : ASK_SYSTEM, text: `${sum.text}${screen}${found}\n\nThe student asks: ${clean}`, schema: screen ? ASK_SCREEN_SCHEMA : ASK_SCHEMA, maxTokens: screen ? 1400 : 600}; });
    if (!d) { const s = aiRead(); return {why: s.err === "limit" ? "I've used up my thinking for now. Ask me again later?" : s.err === "offline" ? "I need the internet for that one. Try again soon?" : ""}; }
    const answer = cleanLine(d.answer, screen ? 650 : found ? 400 : 220, BAD_ASK);
    if (!answer) return {why: ""};
    const idea = cleanIdea({text: d.action === "focus" ? "Start a focus on it?" : "Review some flashcards?", action: d.action, ref: d.ref}, sum.refs);
    return {answer, idea: idea && ideaValid(idea) ? Object.assign(idea, {yes: d.action === "focus" ? "Start Focus" : "Review"}) : null};
  }
  function welcomeBack(){ if (awayMs >= 30 * 60000 && awayMs < 3 * 3600000) queueMoment({about: "welcome", detail: `the student is back after ${Math.round(awayMs / 60000)} minutes away`}); }
  // Once a day: a busy week gets its own lines
  function weekCheck(){ const s = aiRead(); if (s.weekDay === todayISO() || !cur) return; const n = aiSummary().dueWeek; if (n >= 8) { s.weekDay = todayISO(); aiWrite(s); queueMoment({about: "week", detail: `a busy week: ${n} things due in the next 7 days`}); } }
  function aiUsage(){ const s = today0(aiRead()); return {n: s.n || 0, max: aiMax(), paused: aiPaused(s), mode: aiMode()}; }

  /* Pointer: tap, hover, long press, right click (no dragging: it lives in its homes) */
  let press = null, looking = false, lookT = 0, lastHover = 0, suppressUntil = 0;
  function onDown(e){
    if (!box || e.button > 0 || !ours(e.clientX, e.clientY)) return;
    e.preventDefault(); e.stopPropagation();
    suppressUntil = performance.now() + 900;
    press = {id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, lp: setTimeout(() => { if (press && !press.moved) { press.done = true; openPicker(); } }, 560)};
  }
  function onMove(e){
    if (press && e.pointerId === press.id) {
      if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) { press.moved = true; clearTimeout(press.lp); }
      return;
    }
    if (!act || !box || box.hidden) return;
    const dragging = e.buttons > 0;
    if (e.pointerType === "touch" && !dragging) return;
    if (e.timeStamp - lastHover < 50) return; lastHover = e.timeStamp;
    const r = box.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * (cur.eyes.y / VB);
    const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
    if (mood === "idle" || mood === "break") {
      if (d < 520 || dragging) { looking = true; act.look(Math.max(-1, Math.min(1, dx / 140)), Math.max(-1, Math.min(1, dy / 140))); clearTimeout(lookT); lookT = setTimeout(() => { looking = false; if (act && (mood === "idle" || mood === "break")) act.look(0, 0); }, 2600); }
      else if (looking) { looking = false; act.look(0, 0); }
    }
    if (dragging) return;
    const over = d < r.width && ours(e.clientX, e.clientY);
    document.documentElement.classList.toggle("cp-hover", over);
    if (over && !box.classList.contains("cp-hov")) { box.classList.add("cp-hov"); if (!busy() && mood === "idle") act.mouth("smile"); }
    else if (!over && box.classList.contains("cp-hov")) { box.classList.remove("cp-hov"); if (!busy() && mood === "idle") act.mouth("neutral"); }
  }
  function onUp(e){
    if (!press || e.pointerId !== press.id) return;
    const p = press; press = null; clearTimeout(p.lp);
    e.preventDefault(); e.stopPropagation();
    if (!p.done && !p.moved && e.type !== "pointercancel") react();
  }
  document.addEventListener("pointerdown", e => {
    noteInput();
    if (box && !box.hidden && !(box.contains(e.target)) && !(front && front.contains(e.target))) { if (bubbleIdea) hideBubble(); if (mood === "idle" && Math.random() < 0.6) glanceAt(e.clientX, e.clientY, 1400); }
    onDown(e);
  }, true);
  document.addEventListener("pointermove", onMove, {capture: true, passive: false});
  document.addEventListener("pointerup", onUp, true);
  document.addEventListener("pointercancel", onUp, true);
  document.addEventListener("click", e => { if (performance.now() < suppressUntil && box && e.detail !== 0) { const r = box.getBoundingClientRect(); if (e.clientX >= r.left - 20 && e.clientX <= r.right + 20 && e.clientY >= r.top - 20 && e.clientY <= r.bottom + 20) { e.preventDefault(); e.stopPropagation(); suppressUntil = 0; } } }, true);
  document.addEventListener("touchstart", e => { const t = e.touches[0]; if (t && e.touches.length === 1 && ours(t.clientX, t.clientY)) e.preventDefault(); }, {capture: true, passive: false});
  document.addEventListener("contextmenu", e => { if (ours(e.clientX, e.clientY)) { e.preventDefault(); e.stopPropagation(); if (press) { clearTimeout(press.lp); press = null; } openPicker(); } }, true);
  // Attention: it glances at where you're typing
  let typeT = 0;
  document.addEventListener("keydown", e => {
    noteInput();
    if (box && e.target === box.querySelector(".cp-hit")) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); react(); }
      else if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) { e.preventDefault(); openPicker(); }
      return;
    }
    const t = e.target; if (!t || !t.getBoundingClientRect || typeT) return;
    if (!/^(INPUT|TEXTAREA)$/.test(t.tagName) && !t.isContentEditable) return;
    typeT = setTimeout(() => { typeT = 0; }, 900);
    const r = t.getBoundingClientRect(); glanceAt(r.left + Math.min(r.width, 300) / 2, r.top + r.height / 2, 2500);
  }, true);
  addEventListener("wheel", () => { BR.input = Date.now(); if (mood === "nap") wake(); }, {passive: true});

  /* Pause when hidden, follow reduced motion, theme changes and the page's layout */
  document.addEventListener("visibilitychange", () => {
    if (!layer) return;
    [layer, front].forEach(el => el && el.classList.toggle("cp-paused", document.hidden));
    if (document.hidden) { clearTimers(); if (act) act.stopAll(); aiSeen(); }
    else { const s = aiRead(); awayMs = s.seen ? Date.now() - s.seen : 0; noteInput(); schedule(); welcomeBack(); aiMaybe("back"); sAt = 0; guardSoon("visible"); }
  });
  if (mq) (mq.addEventListener ? mq.addEventListener("change", () => { applyVars(); if (act) act.stopAll(); schedule(); }) : mq.addListener(() => { applyVars(); schedule(); }));
  let refreshT = 0;
  const refresh = ms => { clearTimeout(refreshT); refreshT = setTimeout(() => { try { passCacheReset(); build(); } catch (e) { console.warn("companion", e); } }, ms || 0); };
  new MutationObserver(() => refresh(60)).observe(document.documentElement, {attributes: true, attributeFilter: ["data-skin", "data-theme"]});
  // The placement guard's triggers (see clamp)
  // back from a frozen spell: settle in the same frame, so it never trails the tab bar
  const dockNow = () => { if (phone() && (spotKind === "dock" || spotKind === "pin" || spotKind === "slot") && !dockFrozen()) try { place(false); } catch (e) {} };
  addEventListener("resize", () => { sAt = 0; dockNow(); try { clamp("resize"); } catch (e) {} placeSoon(200); });
  addEventListener("orientationchange", () => { sAt = 0; try { clamp("rotate"); } catch (e) {} placeSoon(350); guardSoon("rotate", 700); });
  addEventListener("pageshow", () => { sAt = 0; guardSoon("pageshow"); });
  if (window.visualViewport) ["resize", "scroll"].forEach(k => visualViewport.addEventListener(k, () => { sAt = 0; if (k === "resize") dockNow(); guardSoon("viewport", 30); if (k === "resize") placeSoon(250); }));
  document.addEventListener("focusin", () => { guardSoon("focus", 350); guardSoon("keyboard", 800); });
  document.addEventListener("focusout", () => guardSoon("blur", 350));
  new MutationObserver(() => { sAt = 0; vext = null; guardSoon("text-size", 100); placeSoon(150); }).observe(document.documentElement, {attributes: true, attributeFilter: ["data-ts", "data-hc"]});
  try { if (document.fonts) { document.fonts.ready.then(() => guardSoon("fonts")); document.fonts.addEventListener("loadingdone", () => guardSoon("fonts", 100)); } } catch (e) {}
  // The safety net
  setInterval(() => { if (box && !box.hidden && !document.hidden) { try { clamp("watchdog"); } catch (e) {} if (!travelAnim && !press) fitHit(); } }, 2000);
  { const nav = document.querySelector("nav.tabs"); if (nav) new MutationObserver(() => placeSoon(80)).observe(nav, {attributes: true, attributeFilter: ["data-fit"]}); }
  // The page changing shape under it (a banner or card appearing, a list growing)
  try { const v = document.getElementById("view"); if (v && window.ResizeObserver) new ResizeObserver(() => { guardSoon("layout", 100); if (!travelAnim && !press) placeSoon(450); }).observe(v); } catch (e) {}
  let lastTab = "", lastRoam = Date.now(), nextRoam = Date.now() + rand(12, 25) * 60000;
  const roamDue = chance => Date.now() - lastRoam > 4 * 60000 && Math.random() < chance;
  // A stroll on its own every 12 to 25 minutes while you're around
  setInterval(() => {
    if (!box || box.hidden || document.hidden || !isOn() || Date.now() < nextRoam || (dlg && dlg.open) || travelAnim || press || phone() || staysPut()) return;
    if (typeof pomo !== "undefined" && pomo && pomo.running) return;
    if (Date.now() - BR.input < 8000) return;
    nextRoam = Date.now() + rand(12, 25) * 60000; lastRoam = Date.now();
    placeSoon(0, true);
  }, 30000);
  hook("render", tab => {
    if (!layer) { if (isOn()) refresh(0); return; }
    applyVars(); fitHitSoon();
    const newTab = tab !== lastTab, first = !lastTab, wander = newTab && !first && !phone() && !staysPut() && roamDue(0.2);
    if (wander) lastRoam = Date.now();
    placeSoon(newTab ? (phone() ? 0 : 160) : 400, first || wander);
    if (newTab) { lastTab = tab; if (!first && wander) later(curious, 500); }
  });
  hook("boot", () => { lastTab = ui.tab; refresh(0); BR.knownTasks = new Set(Object.keys(state.tasks || {})); BR.doneIds = new Set(Object.values(state.tasks || {}).filter(t => t && t.status === "done").map(t => t.id)); });
  hook("plan-changed", () => { curSig = ""; refresh(0); });
  hook("stats-focus", () => later(checkUnlocks, 2500));
  // Curious about a new task; remembers what you finish
  hook("changed", changes => {
    if (!Array.isArray(changes)) return;
    const known = BR.knownTasks || (BR.knownTasks = new Set());
    let fresh = false;
    changes.forEach(c => {
      if (c.kind !== "task" || !c.after) return;
      if (!known.has(c.id)) { known.add(c.id); fresh = true; }
      if (!BR.doneIds) BR.doneIds = new Set();
      if (c.after.status === "done" && !BR.doneIds.has(c.id) && (!BR.taskDone || BR.taskDone.id !== c.id)) { BR.taskDone = {id: c.id, title: c.after.title, at: Date.now()}; afterTask(); queueMoment({about: "task", detail: `just finished "${shortT(c.after.title, 50)}" (${c.after.type || "task"})`}); }
      if (fresh && c.after.status !== "done" && /exam|quiz|test|midterm|final/i.test((c.after.type || "") + " " + (c.after.title || "")) && c.after.due) queueMoment({about: "exam", detail: `a new ${c.after.type || "exam"} was added: "${shortT(c.after.title, 50)}" due ${c.after.due}`});
    });
    changes.forEach(c => { if (c.kind === "task") { if (c.after && c.after.status === "done") BR.doneIds.add(c.id); else BR.doneIds.delete(c.id); } });
    if (fresh && act && mood === "idle") { noteInput(); hold(1200); act.eyes("open"); spawnFx("bang", 1); if (!still()) act.motion(partSvg(cur.parts.head) ? "headTilt" : "bounce"); }
  });

  /* Focus timer, finished tasks and scene moments */
  hook("focus", e => {
    if (!act || !e) return;
    noteInput();
    const studyMood = cur.sleepy ? "doze" : "study";
    if (e.type === "start") {
      if (e.mode === "focus") { if (!still()) act.motion("hop"); later(() => { if (!act) return; setMood(studyMood); if (!still()) act.motion("nod"); }, still() ? 0 : 650); if (still()) setMood(studyMood); }
      else { setMood("break"); act.motion("stretch"); }
    } else if (e.type === "pause" || e.type === "stop") setMood("idle");
    else if (e.type === "end") {
      setMood("idle");
      if (e.mode === "focus" && !e.missed) { cheer("done", 350); doneTalk(); const t = typeof pomo !== "undefined" && pomo && pomo.taskId && state.tasks[pomo.taskId]; queueMoment({about: "focus", detail: `a ${e.minutes || 25} minute focus session just ended${t ? ` (on "${shortT(t.title, 50)}")` : ""}; ${focusToday()} min of focus today`}); }
      if (e.auto) later(() => { if (!act) return; if (e.next === "focus") setMood(studyMood); else { setMood("break"); act.motion("stretch"); } }, 2600);
    }
  });
  hook("celebrate", () => { cheer("task", 250); });

  /* Talking on its own */
  const CHAT_KEY = "studyboard:comp:chat";
  const chatRead = () => { try { return Number(localStorage.getItem(CHAT_KEY)) || 0; } catch (e) { return 0; } };
  const chatMark = () => { try { localStorage.setItem(CHAT_KEY, String(Date.now())); } catch (e) {} };
  const quietNow = () => !isOn() || !talkOn() || !cur || !box || box.hidden || document.hidden || (dlg && dlg.open)
    || (front && front.querySelector(".cp-bubble.on")) || (typeof pomo !== "undefined" && pomo && pomo.running && pomo.mode === "focus")
    || (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) || document.activeElement?.isContentEditable;
  let taskTalkT = 0;
  // A focus session just ended
  let doneTalkT = 0;
  function doneTalk(){
    clearTimeout(doneTalkT);
    let tries = 0;
    const go = () => { if (++tries > 20) return; if (quietNow() || bubbleOpen()) { doneTalkT = setTimeout(go, 3000); return; } say(momentLine() || pickFrom(cur.id + ":done", ownLines("done")), {cheer: true}); chatMark(); };
    doneTalkT = setTimeout(go, 2500);
  }
  function afterTask(){
    clearTimeout(taskTalkT);
    taskTalkT = setTimeout(() => {
      if (quietNow()) return;
      const m = momentLine();
      const d = BR.taskDone, named = d && fitsT(d.title) && Date.now() - d.at < 60000 && Math.random() < 0.35 ? `Woohoo! ${cleanT(d.title)} is done!` : "";
      say(m || named || pickFrom(cur.id + ":task", ownLines("task")), {cheer: true});
      chatMark();
    }, 15000);
  }
  let sinceVisible = Date.now();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) sinceVisible = Date.now(); });
  // About once an hour (50 to 75 minutes apart, counted across reloads)
  if (!chatRead()) chatMark();
  setInterval(() => chatTick(false), 60000);
  // Tasks due soon without estimates
  let estLast = 0;
  setInterval(() => {
    const big = typeof SBEST !== "undefined" && SBEST && SBEST.justImported() && Date.now() - estLast > 30 * 60000;
    if (!big && (estAsked() || Date.now() - sinceVisible < 2 * 60000)) return;
    if (Date.now() - BR.input < 5000 || quietNow() || mood === "nap" || mood === "doze") return;
    const i = estIdea(big); if (!i) return;
    estLast = Date.now(); estMark(); say(i.text, {idea: i});
    if (act && !still()) { act.eyes("happy"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => act && mood === "idle" && act.eyes("open"), 1400); }
  }, 20000);
  // A prep session due today (Exam Prep Planner)
  setInterval(() => {
    try {
      if (!window.SBPREP || Date.now() - sinceVisible < 90000 || Date.now() - BR.input < 6000 || quietNow() || mood === "nap" || mood === "doze") return;
      const o = SBPREP.offer(); if (!o || !SPEECH.ok(o.text, "prep")) return;
      say(o.text, {idea: o, ms: 12000});
      if (bubbleIdea === o) { SBPREP.offered(o.taskId); chatMark(); if (act && !still()) { act.eyes("happy"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => act && mood === "idle" && act.eyes("open"), 1400); } }
    } catch (e) { console.warn("prep offer", e); }
  }, 50000);
  // Exam Mode (97-exammode.js)
  setInterval(() => {
    try {
      if (!window.SBEXAM || Date.now() - sinceVisible < 2 * 60000 || Date.now() - BR.input < 6000 || quietNow() || mood === "nap" || mood === "doze") return;
      const o = SBEXAM.offer(); if (!o || !SPEECH.ok(o.text, "exam")) return;
      say(o.text, {idea: o, ms: 12000, cat: "exam"});
      if (bubbleIdea === o) { SBEXAM.offered(); chatMark(); if (act && !still()) { act.eyes("happy"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => act && mood === "idle" && act.eyes("open"), 1400); } }
    } catch (e) { console.warn("exam mode offer", e); }
  }, 55000);
  // A crunch week 2 to 5 weeks out
  setInterval(() => {
    try {
      if (!window.SBCRUNCH || Date.now() - sinceVisible < 3 * 60000 || Date.now() - BR.input < 6000 || quietNow() || mood === "nap" || mood === "doze") return;
      const o = SBCRUNCH.offer(); if (!o || !SPEECH.ok(o.text)) return;
      say(o.text, {idea: o, ms: 14000});
      if (bubbleIdea === o) { SBCRUNCH.offered(o.week); chatMark(); if (act && !still()) { act.eyes("happy"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => act && mood === "idle" && act.eyes("open"), 1400); } }
    } catch (e) { console.warn("crunch offer", e); }
  }, 45000);
  // Once, to someone with an empty planner
  setInterval(() => {
    try {
      if (!window.SBSEM || Date.now() - sinceVisible < 2 * 60000 || Date.now() - BR.input < 6000 || quietNow() || mood === "nap" || mood === "doze") return;
      const o = SBSEM.offer(); if (!o || !SPEECH.ok(o.text)) return;
      say(o.text, {idea: o, ms: 14000});
      if (bubbleIdea === o) { SBSEM.offered(); chatMark(); if (act && !still()) { act.eyes("happy"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => act && mood === "idle" && act.eyes("open"), 1400); } }
    } catch (e) { console.warn("semester offer", e); }
  }, 40000);
  function chatTick(force){
    const last = chatRead(), gap = (50 + (Math.abs(last) % 26)) * 60000;
    if (!force && (Date.now() - last < gap || Date.now() - sinceVisible < 4 * 60000 || Date.now() - BR.input < 6000)) return false;
    if (quietNow()) return false;
    if (mood === "nap" || mood === "doze") return false;
    const est = estIdea();
    if (est) { estMark(); say(est.text, {idea: est}); chatMark(); if (act && !still()) { act.eyes("happy"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => act && mood === "idle" && act.eyes("open"), 1400); } return true; }
    const idea = ideaNow(), useIdea = idea && Math.random() < 0.3 && !dismissedIdea();
    if (useIdea) say(idea.text, {idea, ask: askAvailable()}); else say(tapLine());
    chatMark();
    if (act && !still()) { act.eyes("happy"); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); later(() => act && mood === "idle" && act.eyes("open"), 1400); }
    return true;
  }
  const wrap = (get, set, delay) => { try { const orig = get(); if (typeof orig !== "function") return; set(function () { const r = orig.apply(this, arguments); cheer("done", delay); return r; }); } catch (e) {} };
  wrap(() => finishQuiz, f => { finishQuiz = f; }, 900);
  wrap(() => aiFinish, f => { aiFinish = f; }, 900);
  try {
    const origRate = rateCard;
    rateCard = function () { const f = ui.fc, r = origRate.apply(this, arguments); if (f && f.mode === "study" && !f.q[f.i] && !f.cpDone) { f.cpDone = true; cheer("done", 900); } return r; };
  } catch (e) {}

  /* Picker: choose, rename, accessories, options */
  let pickActors = [], pickTimer = 0;
  function stopPreviews(){ clearInterval(pickTimer); pickTimer = 0; pickActors.forEach(a => a.stopAll()); pickActors = []; }
  // A companion as one still picture, for long lists: one image scrolls far more smoothly than a full drawing.
  // The picture has a margin (M) so ears and hats past the drawing's edge aren't cut off.
  const fp = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = (Math.imul(h, 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36) + ":" + t.length; };
  const STILL_CSS = ".cp-p,.cp-headg,.cp-eye,.cp-page{transform-box:view-box}.cp-cheeks{opacity:.62}.cp-e-happy,.cp-e-sleepy,.cp-mouth>g,.cp-prop,.cp-zs{display:none}.cp-mouth>.cp-m-neutral{display:inline}";
  const STILL_M = 0.15, stills = {}, stillFps = {};
  function stillUrl(c){
    if (stills[c.id]) return stills[c.id];
    const m = 120 * STILL_M, svg = rigSvg(c, {}).replace(/var\(--cp-wear,[^)]*\)/g, wearColor(c))
      .replace(/<svg([^>]*)>/, (all, at) => `<svg xmlns="http://www.w3.org/2000/svg"${at.replace(/\sviewBox="[^"]*"/, ` viewBox="${-m} ${-m} ${120 + 2 * m} ${120 + 2 * m}"`).replace(/\soverflow="[^"]*"/, "")}><style>${STILL_CSS}</style>`);
    // its fingerprint leaves out the per-drawing id endings ("-u9"), which change every time it's drawn
    stillFps[c.id] = fp(svg.replace(/-u[0-9a-z]+(?=["')])/g, ""));
    return (stills[c.id] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  }
  const stillFp = c => { stillUrl(c); return stillFps[c.id]; };
  // Each picture becomes a small bitmap in quiet moments (never mid-scroll), kept for the session,
  // so a long list opens at once and scrolls smoothly
  const pngs = {}, pngQ = [];
  let pngBusy = false, lastScrollC = 0;
  document.addEventListener("scroll", () => { lastScrollC = performance.now(); }, {capture: true, passive: true});
  const nap = ms => new Promise(r => setTimeout(r, ms));
  const idleTick = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(() => r(), {timeout: 500}) : setTimeout(r, 30)));
  async function stillPng(c){
    const img = new Image(); img.src = stillUrl(c); await img.decode();
    const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1)), px = Math.round(64 * (1 + 2 * STILL_M) * k), cv = document.createElement("canvas");
    cv.width = cv.height = px; cv.getContext("2d").drawImage(img, 0, 0, px, px);
    const blob = await new Promise(r => cv.toBlob(r, "image/png")); if (!blob) throw new Error("no bitmap");
    return blob;
  }
  // Saved between visits: each bitmap is kept with a fingerprint of its drawing, so a redrawn companion is made again
  const STILL_KEY = "studyboard:compStills:v2", stillPx = () => Math.round(64 * (1 + 2 * STILL_M) * Math.min(3, Math.max(1, window.devicePixelRatio || 1)));
  let saved = null, savedLoad = null, saveT = 0;
  const loadSaved = () => savedLoad || (savedLoad = (async () => {
    let st = null; try { st = window.SBUI && SBUI.cacheGet ? await SBUI.cacheGet(STILL_KEY) : null; } catch (e) {}
    saved = st && typeof st === "object" ? st : {};
    const px = stillPx(), ids = Object.keys(saved);
    for (let i = 0; i < ids.length; i++) {
      if (i % 24 === 23) await idleTick();
      const id = ids[i], v = saved[id], c = BYID[id];
      if (!c || pngs[id] || !v || !v.blob || v.px < px || v.h !== stillFp(c)) continue;
      // a copy in memory: a saved picture is read from disk each time it's shown otherwise
      let mem = v.blob; try { mem = new Blob([await v.blob.arrayBuffer()], {type: v.blob.type || "image/png"}); } catch (e) {}
      pngs[id] = URL.createObjectURL(mem); swapStill(id);
    }
  })());
  // Read the saved pictures a little after start-up, so the shop's lists open ready
  // and make any that are missing (once per device; they're saved), a few at a time in quiet moments
  let warmAll = false;
  hook("boot", () => setTimeout(() => idleTick().then(loadSaved).then(() => { if (Object.keys(BYID).some(id => !pngs[id])) { warmAll = true; warmStills(); } }), 5000));
  const swapStill = id => document.querySelectorAll(`img.cp-still[data-still="${CSS.escape(id)}"]`).forEach(im => { im.src = pngs[id]; });
  const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => { if (saved && window.SBUI && SBUI.cacheSet) SBUI.cacheSet(STILL_KEY, saved).catch(() => {}); }, 1500); };
  // Every companion, in quiet moments while the Style Shop is open, so its lists are ready
  const warmStills = () => { Object.keys(BYID).forEach(id => { if (!pngs[id] && !pngQ.includes(id)) pngQ.push(id); }); setTimeout(pumpStills, 400); };
  function pumpStills(){
    if (pngBusy || !pngQ.length) return; pngBusy = true;
    (async () => {
      try {
        await loadSaved();
        while (pngQ.length) {
          while (performance.now() - lastScrollC < 300) await nap(150);
          await idleTick();
          const id = pngQ.shift(), c = BYID[id]; if (!c || pngs[id]) continue;
          if (!warmAll && !document.querySelector(`img.cp-still[data-still="${CSS.escape(id)}"]`) && !(dlg.open && dlg.querySelector(".sheet.shop"))) continue;
          try {
            const h = stillFp(c), b = await stillPng(c);
            pngs[id] = URL.createObjectURL(b); saved[id] = {h, px: stillPx(), blob: b}; saveSoon();
          } catch (e) { pngs[id] = stillUrl(c); }
          swapStill(id);
        }
        primeStills();
      } finally { pngBusy = false; }
    })();
  }
  // Pictures of a long list load a few at a time just after it opens (not all at once, which delays opening,
  // and not only as they scroll into view, which costs frames mid-scroll)
  let priming = false;
  function primeStills(){
    if (priming) return; priming = true;
    (async () => {
      try {
        for (;;) {
          while (performance.now() - lastScrollC < 300) await nap(150);
          await idleTick();
          const next = [...document.querySelectorAll('img.cp-still[loading="lazy"]')].filter(im => im.src.startsWith("blob:")).slice(0, 12);
          if (!next.length) break;
          next.forEach(im => { im.loading = "eager"; });
        }
      } finally { priming = false; }
    })();
  }
  const stillHtml = (c, px) => {
    const w = Math.round(px * (1 + 2 * STILL_M)), o = (w - px) / 2, ready = pngs[c.id];
    if (!ready && !pngQ.includes(c.id)) { pngQ.push(c.id); setTimeout(pumpStills, 0); }
    setTimeout(primeStills, 50);
    return `<img class="cp-still" data-still="${esc(c.id)}" src="${ready || stillUrl(c)}" width="${w}" height="${w}" style="margin:${-o}px" alt="" decoding="async" loading="lazy" draggable="false">`;
  };
  function previewHtml(c, wear, px){
    return `<span class="cp-prev cp-${c.pose}" style="--px:${px}px;--cp-wear:${wearColor(c)}"><span class="cp-shadow"></span><span class="cp-move"><span class="cp-breathe">${rigSvg(c, {wear})}</span></span></span>`;
  }
  function pickerBody(){
    const list = setOf(skinId()), c = current(), key = themeKey(skinId());
    const skin = SKINS.find(s => s.id === skinId());
    const lockedMsg = paywall() && !pro();
    const want = Number((cfg().pick || {})[key]) || 0;
    const ord = id => { const k = SET_ORDER.indexOf(id); return k < 0 ? 99 : k; };
    const tiles = list.map((x, i) => ({x, i})).sort((p, q) => key === "plain" ? ord(p.x.id) - ord(q.x.id) || p.i - q.i : p.i - q.i).map(({x, i}) => {
      const locked = !canSlot(i), on = c && c.id === x.id, left = focusLeft(x), earn = left > 0 && owns("comp", x.id);
      return `<div class="cp-tile${on ? " on" : ""}${locked ? " locked" : ""}" data-id="${esc(x.id)}" aria-current="${on ? "true" : "false"}">
        ${previewHtml(x, on ? wearOf(x) : "", 92)}
        <div class="cp-tile-t"><b>${esc(on ? nameOf(x) : ownName(x.id) || x.name)}</b>${x.theme === "extra" || earn ? "" : compTier(x) === "pro" ? PRO_BADGE : FREE_BADGE}</div>
        <p class="cp-bio">${esc(x.bio || "")}</p>
        ${earn ? (pct => `<span class="cp-earn">${esc(EARN[x.id].how)} to unlock</span><span class="cp-earn-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progress to unlock ${esc(x.name)}"><i style="width:${pct}%"></i></span><span class="mini">${esc(EARN[x.id].left(left))} to go</span><button type="button" class="link-btn cp-earn-pro" data-act="comp-pick" data-slot="${i}">Or Get It With Pro</button>`)(Math.max(0, Math.min(99, Math.floor((1 - left / EARN[x.id].n) * 100))))
          : locked ? `<button type="button" class="btn small" data-act="comp-pick" data-slot="${i}">🔒 Go Pro</button>` : on ? `<span class="cp-chosen" role="status">✓ ${want !== i && !canSlot(want) ? "In Use" : "Chosen"}</span>` : `<button type="button" class="btn small primary" data-act="comp-pick" data-slot="${i}">Choose</button>`}
      </div>`;
    }).join("");
    const h = hours(), nGot = ACC.filter(isEarned).length, locked = ACC.filter(a => !isEarned(a));
    const hLabel = h < 1 ? `${Math.round(h * 60)} min` : `${h < 10 ? h.toFixed(1).replace(/\.0$/, "") : Math.round(h)} h`;
    const wear = c ? wearOf(c) : [], tints = cfg().tint || {};
    const colOf = id => hexOk(tints[id]) ? tints[id] : ACC_DEF[id] || wearColor(c || {});
    const howRow = a => `<li><b>${esc(a.name)}</b><span class="cp-how-ways">${propProg(a).map(x => `<span class="cp-how-way"><span class="cp-how-t">${esc(x.ask)}</span><span class="cp-how-bar" aria-hidden="true"><i style="width:${Math.round(x.p * 100)}%"></i></span><span class="mini">${esc(pathShort(x))}</span></span>`).join("")}</span></li>`;
    const accTile = a => {
      const got = isEarned(a), can = canWear(a), on = wear.includes(a.id);
      const lift = {hat: 10, cap: 10, crown: 10, beanie: 10, scarf: -6, medal: -6}[a.id];
      const icon = `<svg viewBox="-26 -26 52 52" aria-hidden="true">${a.id === "glasses" ? glassesSvg({lx: -11, rx: 11, y: 0, r: 5}, hexOk(tints[a.id]) ? tints[a.id] : "") : lift ? `<g transform="translate(0 ${lift})">${ACC_ART[a.id]}</g>` : a.id === "cape" ? `<g transform="translate(0 -8) scale(.85)">${ACC_ART.cape}${ACC_ART.capeCollar}</g>` : ACC_ART[a.id]}</svg>`;
      return `<button type="button" class="cp-acc-tile${on ? " on" : ""}${got ? "" : " off"}" data-act="comp-wear" data-acc="${a.id}" aria-pressed="${on}" ${got ? "" : `aria-disabled="true"`}>
        <span class="cp-acc-ic"${hexOk(tints[a.id]) || ACC_DEF[a.id] ? ` style="--cp-wear:${colOf(a.id)}"` : ""}>${icon}</span><span class="cp-acc-n">${esc(a.name)}${a.free ? "" : PRO_BADGE}</span><span class="mini">${got ? (can ? (on ? "Wearing" : "Wear") : "🔒 Pro") : esc(pathShort(closestPath(a)))}</span></button>`;
    };
    const tintRow = id => { const a = ACC.find(x => x.id === id), cur = colOf(id);
      return `<div class="cp-tint" role="group" aria-label="${esc(a.name)} color"><span class="cp-tint-n">${esc(a.name)}</span><span class="cp-tint-sw">${TINTS.map(h => `<button type="button" class="cp-sw${cur.toLowerCase() === h.toLowerCase() ? " on" : ""}" style="background:${h}" data-act="comp-tint" data-acc="${id}" data-color="${h}" aria-label="${h}" aria-pressed="${cur.toLowerCase() === h.toLowerCase()}"></button>`).join("")}<input type="color" class="cp-tint-in" data-acc="${id}" value="${cur}" aria-label="Pick any color for ${esc(a.name)}"><button type="button" class="btn small" data-act="comp-tint" data-acc="${id}" data-color="" ${hexOk(tints[id]) ? "" : "disabled"}>Reset</button></span></div>`; };
    return `<p class="mini" style="margin:0">A little friend who lives in your ${esc(skin ? skin.name : "")} ${key === "plain" ? "theme" : "scene"}. It sits beside the Add Task button, says hi when you tap it, and studies with you during Focus.</p>
      <div class="cp-tiles">${tiles}</div>
      ${c ? `<label class="cp-name"><span>Name</span><span class="cp-name-row"><input type="text" id="cpName" maxlength="${NAME_MAX}" value="${esc(nameOf(c))}" aria-label="Companion name" data-noenter><button type="button" class="btn small" data-act="comp-rename">Save</button></span></label>` : ""}
      <h3 class="fsec">Accessories</h3>
      <p class="mini" style="margin:0">Earn little things to wear by studying your way: focus time, tasks done on time, streaks, flashcards, quizzes, notes and more. ${nGot} of ${ACC.length} earned so far (${hLabel} of focus). Props you earn are yours to keep.</p>
      <div class="cp-accs"><button type="button" class="cp-acc-tile${wear.length ? "" : " on"}" data-act="comp-wear" data-acc="" aria-pressed="${!wear.length}"><span class="cp-acc-ic cp-none"></span><span class="cp-acc-n">Nothing</span><span class="mini">${wear.length ? "Take Off All" : "Wearing"}</span></button>${ACC.map(accTile).join("")}</div>
      <p class="mini" style="margin:0">Wear one prop each on the head, face, neck, chest and back. A new one in the same spot swaps it.</p>
      ${wear.length ? `<h3 class="fsec">Colors</h3><div class="cp-tints">${wear.map(tintRow).join("")}</div>` : ""}
      ${locked.length ? `<h3 class="fsec">How to Earn More</h3><p class="mini" style="margin:0">Any one way unlocks a prop.</p><ul class="cp-how">${locked.map(howRow).join("")}</ul>` : `<p class="mini" style="margin:0">You've earned every prop. Wow!</p>`}
      <h3 class="fsec">Options</h3>
      <div class="cap-row"><span style="flex:1;font-weight:600">Show Companion<span class="sub">Turn it off to hide it everywhere.</span></span><label class="anim-tog"><input type="checkbox" data-act="comp-set" data-key="on" ${isOn() ? "checked" : ""}> On</label></div>
      <div class="cap-row"><span style="flex:1;font-weight:600">Speech Bubbles<span class="sub">Friendly words when you tap it, a cheer when you finish a task, and a hello about once an hour. Never while you're focusing or typing.</span></span><label class="anim-tog"><input type="checkbox" data-act="comp-set" data-key="talk" ${talkOn() ? "checked" : ""}> On</label></div>
      ${smartRow()}`;
  }
  function smartRow(){
    const on = autoOn(), u = aiUsage(), paid = on && smartOn() && u.mode === "paid";
    const sends = "the time of day, how many tasks are due today, this week and overdue, your next 3 deadlines (titles, course codes and dates), the titles of tasks you finished in the last 2 days (and the one you just finished), your streak, your focus minutes, how far off your next exam is, your companion's name and personality, and any question you type into Ask Me (plus, only when you ask about it, the card, note, task, file text or course that's on your screen)";
    const sub = !on ? "Needs automatic AI (Settings, AI Features). Until then it uses its own built-in lines, and nothing is sent anywhere."
      : paid ? `Your automatic AI uses a paid model, so Smart Lines keeps to ${PAID_MAX} small updates a day and Ask Me is off. It sends only: ${sends}.`
      : `Your free Gemini key writes fresh lines and answers Ask Me (tap it, then Ask), using Gemini's lighter models and a separate daily allowance of ${LITE_MAX}, so other AI features aren't affected. It sends only: ${sends}. Nothing is sent while this is off.`;
    const use = on && smartOn() ? `<span class="cp-use">Smart Lines today: ${u.n} of ${u.max}${u.paused ? ". Resting until Gemini's free allowance resets." : ""}</span>` : "";
    return `<div class="cap-row"><span style="flex:1;font-weight:600">Smart Lines and Ask Me<span class="sub">${esc(sub)}</span>${use}</span><label class="anim-tog"><input type="checkbox" data-act="comp-set" data-key="ai" ${on && smartOn() ? "checked" : ""} ${on ? "" : "disabled"}> On</label></div>`;
  }
  function wirePreviews(scope){
    stopPreviews();
    scope.querySelectorAll(".cp-prev").forEach(el => {
      const tile = el.closest("[data-id]"), c = tile && BYID[tile.dataset.id]; if (!c) return;
      pickActors.push(actor(c, el, {}));
    });
    if (!pickActors.length) return;
    pickTimer = setInterval(() => {
      if (document.hidden || !dlg.open || !scope.isConnected) { if (!scope.isConnected) stopPreviews(); return; }
      pickActors.forEach(a => { if (Math.random() < 0.5) a.blink(); if (!still() && Math.random() < 0.28) a.motion(pick(a.c.idle)); });
    }, 2200);
  }
  // Change: just this theme's companions
  function changeBody(){
    const b = pickerBody(), i = b.indexOf('<div class="cp-tiles">'), j = b.indexOf('<h3 class="fsec">Accessories</h3>');
    const mine = i < 0 ? "" : b.slice(i, j > i ? j : undefined), here = themeKey(skinId());
    const rank = k => window.SBUI && typeof SBUI.themeRank === "function" ? SBUI.themeRank(k) : SKINS.findIndex(x => x.id === k);
    const others = Object.keys(REG).filter(k => k !== here && k !== "plain" && SKINS.some(x => x.id === k) && (REG[k].list || []).length).sort((a, b) => rank(a) - rank(b));
    const group = k => { const sk = SKINS.find(x => x.id === k), have = owns("skin", k);
      return `<div class="cp-oth-g"><h4>${esc(sk ? sk.name : k)}${have ? "" : ` ${PRO_BADGE}`}</h4><div class="cp-oth-list">${REG[k].list.map((x, n) => `<button type="button" class="cp-oth" data-act="comp-theme" data-skin="${esc(k)}" data-slot="${n}" data-id="${esc(x.id)}" title="${esc(`${x.name}: switch to the ${sk ? sk.name : k} theme`)}"><span class="cp-still-box">${stillHtml(x, 64)}</span><span>${esc(x.name)}</span></button>`).join("")}</div></div>`; };
    return mine + (others.length ? `<details class="cp-oth-d"${ui.cpOth ? " open" : ""}><summary>Companions from Other Themes</summary><p class="mini" style="margin:0">Tap one to switch to its theme. Each theme has its own companions.</p>${others.map(group).join("")}</details>` : "");
  }
  function openChange(){
    stopPreviews();
    openSheet(`<form class="sheet cp-sheet">${head("Change Companion")}<div class="sheet-body cp-changebody">${changeBody()}</div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></form>`);
    const body = dlg.querySelector(".cp-changebody"); if (body) wirePreviews(body);
    if (!dlg.open) try { dlg.showModal(); } catch (e) {}
  }
  dlg.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("cp-oth-d")) { ui.cpOth = d.open; if (d.open) { const b = dlg.querySelector(".cp-changebody"); if (b) wirePreviews(b); } } }, true);
  function openPicker(){
    stopPreviews();
    openSheet(`<form class="sheet cp-sheet">${head("Study Companion")}<div class="sheet-body cp-pickbody">${pickerBody()}</div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></form>`);
    const body = dlg.querySelector(".cp-pickbody");
    if (body) wirePreviews(body);
    if (!dlg.open) try { dlg.showModal(); } catch (e) {}
  }
  function refreshPicker(){
    if (typeof ui !== "undefined" && ui.tab === "companion") scheduleRender();
    const cb = dlg.open && dlg.querySelector(".sheet-body.cp-changebody");
    if (cb) { const st = cb.scrollTop; cb.innerHTML = changeBody(); cb.scrollTop = st; wirePreviews(cb); return; }
    const body = dlg.open && (dlg.querySelector(".sheet-body.cp-pickbody") || dlg.querySelector("div.cp-shop"));
    if (!body) return;
    const top = body.scrollTop || (body.closest(".sheet-body") || {}).scrollTop;
    if (body.classList.contains("cp-pickbody")) { body.innerHTML = pickerBody(); body.scrollTop = top; wirePreviews(body); }
    else { const sb = body.closest(".sheet-body"), st = sb ? sb.scrollTop : 0; body.innerHTML = shopBody(); wirePreviews(body); if (sb) sb.scrollTop = st; }
  }
  document.addEventListener("change", e => {
    const t = e.target; if (!t || !t.classList || !t.classList.contains("cp-tint-in") || !hexOk(t.value) || !ACC.some(x => x.id === t.dataset.acc)) return;
    setCfg({tint: {[t.dataset.acc]: t.value.toLowerCase()}}); curSig = ""; build(); refreshPicker();
  });
  const DLG_CLOSE = () => { stopPreviews(); dlgShut = performance.now(); dockNow(); setTimeout(dockNow, 850); guardSoon("dialog", 80); };
  dlg.addEventListener("close", DLG_CLOSE);

  hook("act", (a, el) => {
    if (a === "comp-open") { openPicker(); return true; }
    if (a === "comp-change") { openChange(); return true; }
    if (a === "comp-theme") {
      const k = el.dataset.skin, slot = Number(el.dataset.slot) || 0, pickC = REG[k] && REG[k].list[slot];
      if (!pickC) return true;
      if (!owns("skin", k)) { shopUnlock("skin", k); return true; }
      saveStyle({skin: k}); try { applySkin(); } catch (e) {}
      setCfg({pick: {[k]: slot}, on: true}); curSig = ""; build(); refreshPicker(); render();
      toast(`Switched to the ${(SKINS.find(x => x.id === k) || {}).name || "new"} theme with ${pickC.name}`);
      return true;
    }
    if (a === "comp-pick") {
      const slot = Number(el.dataset.slot) || 0;
      const pickC = setOf(skinId())[slot];
      if (!pickC) return true;
      if (!canComp(pickC)) { if (focusLeft(pickC) && owns("comp", pickC.id) && typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(`${pickC.name} unlocks when you ${EARN[pickC.id].how.replace(/^./, ch => ch.toLowerCase())}, or right away with Studyboard Pro.`); else shopUnlock("comp", pickC.id); return true; }
      setCfg({pick: {[themeKey(skinId())]: slot}, on: true});
      curSig = ""; build(); refreshPicker();
      later(() => { if (act) { act.eyes("happy"); act.motion("hop"); spawnFx("heart", 2); later(() => act && act.eyes("open"), 1400); } }, 300);
      return true;
    }
    if (a === "comp-wear") {
      const id = el.dataset.acc || "", acc = ACC.find(x => x.id === id), c = current(); if (!c) return true;
      if (id && !isEarned(acc)) { const w = closestPath(acc); toast(`${acc.name}: ${w.ask}. ${pathShort(w)}.`); return true; }
      if (id && !canWear(acc)) { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet("Every companion accessory comes with Studyboard Pro."); return true; }
      const now = wearOf(c), next = !id ? [] : now.includes(id) ? now.filter(x => x !== id) : now.filter(x => slotOf(x) !== slotOf(id)).concat(id);
      setCfg({wear: {[c.id]: next}}); curSig = ""; build(); refreshPicker();
      if (id && next.includes(id) && act) { act.motion("bounce"); spawnFx("sparkle", 2); }
      return true;
    }
    if (a === "comp-tint") {
      const id = el.dataset.acc, col = el.dataset.color || "";
      if (!ACC.some(x => x.id === id) || (col && !hexOk(col))) return true;
      setCfg({tint: {[id]: col.toLowerCase()}}); curSig = ""; build(); refreshPicker();
      return true;
    }
    if (a === "comp-rename") {
      const c = current(), inp = dlg.querySelector("#cpName") || document.querySelector("#cpName"); if (!c || !inp) return true;
      const v = inp.value.replace(/\s+/g, " ").trim().slice(0, NAME_MAX).trim();
      setCfg({names: {[c.id]: v && v !== c.name ? v : ""}}); curSig = ""; build(); refreshPicker();
      toast(v ? `Say hi to ${v}!` : "Name reset");
      return true;
    }
    if (a === "comp-set") {
      const k = el.dataset.key; if (k !== "on" && k !== "talk" && k !== "ai" && k !== "still") return true;
      setCfg({[k]: !!el.checked}); curSig = ""; build();
      if (k === "still") { homeSig = ""; placeSoon(0, true); }
      if (k === "ai" && el.checked) aiMaybe("setting");
      if (k === "on" && el.checked) later(() => { if (act) { act.motion("hop"); spawnFx("heart", 2); } }, 300);
      return true;
    }
    if (a === "comp-more") { const box2 = dlg.querySelector(".cp-all"); if (box2) { const open = box2.hidden; box2.hidden = !open; el.setAttribute("aria-expanded", open); el.textContent = open ? "Hide Other Themes" : "See Every Theme's Companions"; if (open && !box2.dataset.done) { box2.dataset.done = "1"; box2.innerHTML = allThemesHtml(); } } return true; }
    if (a === "scene-moment") cheer("done", 900);
    return false;
  });
  hook("menu", () => {
    const c = current(); if (!c) return "";
    return `<button data-act="comp-open" data-group="appearance"><span>Study Companion<span class="sub">${isOn() ? `${esc(nameOf(c))} the ${esc(c.kind || "companion")} lives in your theme` : "Turned off. A little friend who studies with you."}</span></span></button>` + (phone() ? "" : `<div class="cap-row sb-wide" data-group="appearance"><span style="flex:1;font-weight:600;min-width:12rem">Companion Stays Put<span class="sub">The companion stays in the bottom-left corner instead of moving around the page. It still moves into its circle when you open the Companion tab.</span></span><label class="anim-tog"><input type="checkbox" data-act="comp-set" data-key="still" ${cfg().still === true ? "checked" : ""}> On</label></div>`);
  });

  /* Style Shop: a Companions tab */
  function allThemesHtml(){
    const names = id => { const s = SKINS.find(x => x.id === id); return s ? s.name : id === "plain" ? "Plain Colors" : id; };
    const keys = ["plain"].concat(SKINS.map(s => s.id).filter(id => REG[id]));
    return keys.filter(k => REG[k]).map(k => `<div class="cp-row"><div class="cp-row-t">${esc(names(k))}${k === themeKey(skinId()) ? `<span class="tp-now">Your Theme</span>` : ""}</div><div class="cp-row-l">${REG[k].list.map((x, i) => `<span class="cp-mini" ${canComp(x) ? "" : `data-act="shop-unlock" data-kind="comp" data-id="${esc(x.id)}" role="button" tabindex="0"`} title="${esc(x.name + ", " + (x.kind || ""))}"><span class="cp-still-box">${stillHtml(x, 64)}</span><span>${esc(x.name)}${compTier(x) === "pro" ? PRO_BADGE : ""}${canComp(x) ? "" : " 🔒"}</span></span>`).join("")}</div></div>`).join("");
  }
  function shopBody(){
    return `${pickerBody()}<button type="button" class="btn small cp-more" data-act="comp-more" aria-expanded="false">See Every Theme's Companions</button><div class="cp-all" hidden></div>`;
  }
  const origShop = styleShop;
  styleShop = function (tab) {
    const t = tab || ui.shopTab || "themes";
    if (t !== "companions") {
      const r = origShop.apply(this, arguments);
      try { addShopTab(); } catch (e) { console.warn("companion shop", e); }
      return r;
    }
    const r = origShop.call(this, "notes");
    ui.shopTab = "companions";
    try {
      const body = dlg.querySelector(".sheet.shop .sheet-body");
      if (body) {
        addShopTab();
        const bar = body.querySelector(".ui-shop-bar") || body.querySelector(".shop-tabs");
        [...body.children].filter(el => el !== bar && !el.classList.contains("shop-note") && bar && (bar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)).forEach(el => el.remove());
        const chips = body.querySelector(".ui-chips"); if (chips) chips.remove();
        body.querySelectorAll('[data-act="shop-tab"]').forEach(b => { const on = b.dataset.id === "companions"; b.setAttribute("aria-selected", on); b.setAttribute("aria-pressed", on); });
        body.insertAdjacentHTML("beforeend", `<div class="cp-shop">${shopBody()}</div>`);
        body.dataset.uiTab = "companions";
        wirePreviews(body.querySelector(".cp-shop"));
        warmStills();
      }
    } catch (e) { console.warn("companion shop", e); }
    return r;
  };
  function addShopTab(){
    const tabs = dlg.querySelector(".sheet.shop .shop-tabs");
    if (!tabs || tabs.querySelector('[data-id="companions"]')) return;
    tabs.insertAdjacentHTML("beforeend", `<button type="button" role="tab" data-act="shop-tab" data-id="companions" aria-selected="false" aria-pressed="false">Companions</button>`);
  }

  /* For the preview tool, the art check and tests */
  function check(){
    const errs = [], warns = [], ids = new Set(), names = {}, kinds = {}, svgIds = {};
    const known = new Set(SKINS.filter(s => s.group !== "plain").map(s => s.id)); known.add("plain");
    const seenTheme = new Set();
    const E = (who, m) => errs.push(`${who}: ${m}`), W = (who, m) => warns.push(`${who}: ${m}`);
    DATA.forEach((t, ti) => {
      const th = t && t.theme; const who0 = th || "entry " + ti;
      if (!th) { E(who0, "missing theme id"); return; }
      if (!known.has(th)) E(who0, `unknown theme id "${th}"`);
      if (seenTheme.has(th)) E(who0, "theme registered twice"); seenTheme.add(th);
      const list = Array.isArray(t.companions) ? t.companions : [];
      if (list.length !== SET_SIZE(th)) E(who0, `needs exactly ${SET_SIZE(th)} companions (has ${list.length})`);
      if (t.spot && !(num(t.spot.x) && num(t.spot.y) && t.spot.x >= 0 && t.spot.x <= 1 && t.spot.y >= 0.2 && t.spot.y <= 1)) E(who0, "spot must be {x: 0..1, y: 0.2..1}");
      list.forEach((c, i) => {
        const who = `${th} #${i + 1} ${c && c.id || "?"}`;
        if (!c || !c.id) { E(who, "missing id"); return; }
        if (!new RegExp(`^${th}-[a-z0-9]+(-[a-z0-9]+)*$`).test(c.id)) E(who, `id must look like "${th}-<subject>" (lowercase)`);
        if (ids.has(c.id)) E(who, "duplicate id"); ids.add(c.id);
        if (!c.name || typeof c.name !== "string" || c.name.length > 12) E(who, "name: 1 to 12 characters");
        if (!c.kind || c.kind.length > 22) E(who, "kind: 1 to 22 characters, Title Case");
        if (!c.bio || c.bio.length > 80) E(who, "bio: one line, at most 80 characters");
        (names[String(c.name).toLowerCase()] = names[String(c.name).toLowerCase()] || []).push(c.id);
        (kinds[String(c.kind).toLowerCase()] = kinds[String(c.kind).toLowerCase()] || []).push(c.id);
        if (!POSES.includes(c.pose)) E(who, `pose must be one of ${POSES.join(", ")}`);
        if (c.size != null && !(num(c.size) && c.size >= 0.8 && c.size <= 1.15)) E(who, "size must be 0.8 to 1.15");
        const P = c.parts || {};
        Object.keys(P).forEach(k => { if (!PIVOT_PARTS.includes(k) && !STATIC_PARTS.includes(k)) E(who, `unknown part "${k}"`); });
        if (!partSvg(P.body)) E(who, "parts.body is required");
        STATIC_PARTS.forEach(k => { if (P[k] != null && typeof P[k] !== "string") E(who, `parts.${k} must be an SVG string`); });
        PIVOT_PARTS.forEach(k => { if (P[k] == null) return; if (typeof P[k] !== "object" || typeof P[k].svg !== "string" || !pt(P[k].pivot)) E(who, `parts.${k} must be {svg, pivot: [x, y]}`); else if (P[k].pivot.some(v => v < -10 || v > 130)) E(who, `parts.${k} pivot is outside the box`); });
        if ((P.armL && !P.armR) || (P.armR && !P.armL)) W(who, "only one arm (fine if intended)");
        if ((P.wingL && !P.wingR) || (P.wingR && !P.wingL)) E(who, "wings come in pairs (wingL and wingR)");
        if (partSvg(P.head) && !pt(c.neck)) E(who, "neck: [x, y] is required when there is a head");
        const idle = Array.isArray(c.idle) ? c.idle : [];
        if (!idle.length || idle.length > 3) E(who, "idle: 1 to 3 signature idles");
        idle.concat(c.cheer ? [c.cheer] : []).forEach(n => {
          if (IDLES[n] == null) { E(who, `unknown idle "${n}" (use: ${Object.keys(IDLES).join(", ")})`); return; }
          const need = IDLES[n]; if (!need) return;
          const ok = need.split("|").some(alt => alt.split(",").every(p => p === "head" ? !!partSvg(P.head) : !!P[p]));
          if (!ok) E(who, `idle "${n}" needs part(s) ${need.replace(/\|/g, " or ").replace(/,/g, " and ")}`);
        });
        if (!c.cheer) E(who, "cheer: pick a celebration motion from the idle list");
        const e = c.eyes || {};
        if (!(num(e.lx) && num(e.rx) && num(e.y) && num(e.r))) E(who, "eyes needs lx, rx, y, r");
        else { if (e.lx >= e.rx) E(who, "eyes.lx must be left of eyes.rx"); if (e.r < 3 || e.r > 9) E(who, "eyes.r should be 3 to 9"); }
        if (e.style && !EYE_STYLES.includes(e.style)) E(who, `eyes.style must be ${EYE_STYLES.join(", ")}`);
        const m = c.mouth || {};
        if (c.mouths) { MOUTH_STATES.forEach(s => { if (typeof c.mouths[s] !== "string") E(who, `mouths.${s} is missing`); }); }
        else if (!(num(m.x) && num(m.y) && num(m.w))) E(who, "mouth needs x, y, w (or custom mouths)");
        if (m.style && !MOUTH_STYLES.includes(m.style)) E(who, `mouth.style must be ${MOUTH_STYLES.join(", ")}`);
        if (c.cheeks && !(num(c.cheeks.lx) && num(c.cheeks.rx) && num(c.cheeks.y))) E(who, "cheeks needs lx, rx, y");
        const A = c.anchors || {};
        ANCHORS.forEach(k => { if (!pt(A[k])) E(who, `anchors.${k} [x, y, scale] is required`); else if (A[k][0] < 0 || A[k][0] > 120 || A[k][1] < 0 || A[k][1] > 120) E(who, `anchors.${k} is outside the box`); else if (A[k][2] != null && !(num(A[k][2]) && A[k][2] >= 0.5 && A[k][2] <= 1.6)) E(who, `anchors.${k} scale should be 0.5 to 1.6`); });
        Object.keys(A).forEach(k => { if (!ANCHORS.includes(k)) E(who, `unknown anchor "${k}"`); });
        const L = c.lines || {};
        Object.entries(LINE_KINDS).forEach(([k, min]) => {
          const arr = L[k];
          if (!Array.isArray(arr) || arr.length < min) { E(who, `lines.${k} needs at least ${min}`); return; }
          arr.forEach(s => { if (typeof s !== "string" || !s.trim()) E(who, `lines.${k} has an empty line`); else { if (s.length > 60) E(who, `line too long (${s.length} > 60): "${s}"`); if (/[—–]/.test(s)) E(who, `no em or en dashes: "${s}"`); } });
        });
        Object.keys(L).forEach(k => { if (!LINE_KINDS[k]) E(who, `unknown line kind "${k}"`); });
        const all = [PIVOT_PARTS, STATIC_PARTS].flat().map(k => partSvg(P[k])).concat(c.mouths ? MOUTH_STATES.map(s => c.mouths[s] || "") : []).join(" ");
        (all.match(/\sid="([^"]+)"/g) || []).forEach(s => { const id = s.slice(5, -1); if (!id.startsWith(c.id + "-")) E(who, `SVG id "${id}" must start with "${c.id}-"`); if (svgIds[id]) E(who, `SVG id "${id}" is used twice`); svgIds[id] = 1; });
        if (/<svg[\s>]/i.test(all)) E(who, "parts are the inside of the SVG: no <svg> wrapper");
        if (/<(script|image|foreignObject)|href=|url\((?!#)/i.test(all)) E(who, "no scripts, images, links or external urls in the art");
        if (/\b(filter|mask)=/.test(all)) W(who, "filters and masks are slow on phones; prefer plain shapes");
      });
    });
    Object.entries(names).forEach(([n, l]) => { if (l.length > 1) W(l.join(", "), `share the name "${n}"`); });
    Object.entries(kinds).forEach(([n, l]) => { if (l.length > 1) W(l.join(", "), `share the kind "${n}"`); });
    const host = document.createElement("div"); host.style.cssText = "position:fixed;left:-9999px;top:0;width:240px;height:240px;visibility:hidden";
    document.body.appendChild(host);
    Object.values(REG).forEach(t => t.list.forEach(c => {
      const who = `${t.theme} ${c.id}`;
      try {
        host.innerHTML = rigSvg(c, {wear: ""});
        const svg = host.querySelector("svg"), rig = svg.querySelector(".cp-rig");
        svg.dataset.e = "open"; svg.dataset.prop = "";
        const bb = rig.getBBox();
        if (bb.x < -4 || bb.y < -4 || bb.x + bb.width > 124 || bb.y + bb.height > 124) E(who, `art goes outside the 0 0 120 120 box (${[bb.x, bb.y, bb.x + bb.width, bb.y + bb.height].map(Math.round).join(", ")})`);
        if (bb.height < 58) W(who, `art is small (${Math.round(bb.height)} tall); fill about 70 to 100 of the box`);
        const bottom = bb.y + bb.height;
        if (c.pose !== "float" && (bottom < 106 || bottom > 118)) E(who, `a ${c.pose} companion's feet should touch the ground line y = 112 (bottom is ${Math.round(bottom)})`);
        if (c.pose === "float" && bottom > 112) E(who, `a float companion should hover above y = 112 (bottom is ${Math.round(bottom)})`);
        PIVOT_PARTS.forEach(k => {
          const el = svg.querySelector(".cp-" + k); if (!el || !c.parts[k]) return;
          const b = el.getBBox(), [x, y] = c.parts[k].pivot, pad = 7;
          if (x < b.x - pad || x > b.x + b.width + pad || y < b.y - pad || y > b.y + b.height + pad) E(who, `parts.${k} pivot [${x}, ${y}] is not on the part (part spans ${Math.round(b.x)},${Math.round(b.y)} to ${Math.round(b.x + b.width)},${Math.round(b.y + b.height)})`);
        });
        if (/L$/.test("armL") && c.parts.armL && c.parts.armR) { const l = svg.querySelector(".cp-armL").getBBox(), r = svg.querySelector(".cp-armR").getBBox(); if (l.x + l.width / 2 > r.x + r.width / 2) E(who, "armL must be the arm on the viewer's left"); }
        if (c.parts.earL && c.parts.earR) { const l = svg.querySelector(".cp-earL").getBBox(), r = svg.querySelector(".cp-earR").getBBox(); if (l.x + l.width / 2 > r.x + r.width / 2) E(who, "earL must be the ear on the viewer's left"); }
        if (c.parts.wingL && c.parts.wingR) { const l = svg.querySelector(".cp-wingL").getBBox(), r = svg.querySelector(".cp-wingR").getBBox(); if (l.x + l.width / 2 > r.x + r.width / 2) E(who, "wingL must be the wing on the viewer's left"); }
        const holder = svg.querySelector(partSvg(c.parts.head) ? ".cp-head" : ".cp-body");
        if (holder) { const hb = holder.getBBox(), e = c.eyes; [[e.lx, e.y], [e.rx, e.y], [c.mouth.x, c.mouth.y]].forEach(([x, y]) => { if (num(x) && (x < hb.x || x > hb.x + hb.width || y < hb.y || y > hb.y + hb.height)) E(who, `face feature at ${x}, ${y} is off the ${partSvg(c.parts.head) ? "head" : "body"}`); }); }
      } catch (err) { E(who, "could not draw: " + err.message); }
    }));
    host.remove();
    const scene = SKINS.filter(s => s.group !== "plain" && s.light && !s.plain && s.id !== "terraces").map(s => s.id);
    const missing = scene.filter(id => !REG[id]).concat(REG.plain ? [] : ["plain"]);
    return {errors: errs, warnings: warns, themes: Object.keys(REG).length, companions: Object.keys(BYID).length, missing};
  }

  // A gallery of every state for the preview tool
  function gallery(ids, o){
    o = o || {};
    const list = (ids && ids.length ? ids : Object.keys(REG)).filter(k => REG[k]);
    document.querySelectorAll("#cpGallery").forEach(x => x.remove());
    const g = document.createElement("div"); g.id = "cpGallery"; if (o.dark) g.classList.add("cpg-dark");
    const bg = (k) => { if (k === "plain") return ""; const h = (fire("thumb", k, !!o.dark) || []).find(Boolean); return h || ""; };
    const st = (c, label, opt, px) => `<figure class="cpg-cell"><span class="cpg-art" style="--px:${px || 110}px;--cp-wear:${wearColor2(c)}">${rigSvg(c, opt)}</span><figcaption>${label}</figcaption></figure>`;
    const wearColor2 = c => { if (c.wearColor) return c.wearColor; const s = SKINS.find(x => x.id === c.theme); return s && s.light ? s.light[8] : "#1F6FEB"; };
    g.innerHTML = list.map(k => {
      const t = REG[k], s = SKINS.find(x => x.id === k);
      return `<section class="cpg-theme"><h2>${esc(s ? s.name : "Plain Colors")} <small>${k}</small></h2>${t.list.map(c => {
        const arm = c.parts.armR ? "armR" : c.parts.armL ? "armL" : "", side = arm === "armL" ? 1 : -1;
        const up = arm ? {[arm]: 115 * side} : {};
        const both = {}; ["armL", "armR"].forEach(p => { if (c.parts[p]) both[p] = (p === "armL" ? 1 : -1) * 140; });
        const rows = [
          st(c, "Idle", {}), st(c, "Blink", {eyes: "blink"}), st(c, "Look Left", {look: [-1, 0]}), st(c, "Look Right", {look: [1, 0]}), st(c, "Look Up", {look: [0, -1]}),
          st(c, "Happy", {eyes: "happy", mouth: "smile"}), st(c, "Talking", {mouth: "open"}), st(c, "Sleepy", {eyes: "sleepy", mouth: "sleepy"}),
          st(c, "Studying", {prop: "book", look: [0, 0.8]}), st(c, arm ? "Wave" : "Wave (no arm: hops)", {eyes: "happy", mouth: "smile", rot: up}), st(c, "Cheer", {eyes: "happy", mouth: "open", rot: both})
        ].join("");
        const accs = ACC.map(a => st(c, a.name, {wear: a.id}, 96)).join("") + st(c, "All Parts Moved", {rot: Object.fromEntries(PIVOT_PARTS.filter(p => c.parts[p]).map(p => [p, /L$/.test(p) ? 25 : -25]).concat(partSvg(c.parts.head) ? [["head", 10]] : [])), eyes: "open"}, 96);
        const sizes = [64, 80, 110].map(px => st(c, px + " px", {}, px)).join("");
        return `<div class="cpg-comp"><div class="cpg-head"><b>${esc(c.name)}</b> <span>${esc(c.kind || "")}</span> <em>${esc(c.bio || "")}</em> <code>${esc(c.id)} · ${c.pose} · idle: ${c.idle.join(", ")} · cheer: ${c.cheer}${c.sleepy ? " · sleepy" : ""}</code></div>
          <div class="cpg-scene">${bg(k)}<div class="cpg-row">${rows}</div></div>
          <div class="cpg-row cpg-plain">${accs}${sizes}</div>
          <div class="cpg-lines">${Object.keys(LINE_KINDS).map(kk => `<p><b>${kk}</b> ${(c.lines[kk] || []).map(esc).join(" · ")}</p>`).join("")}</div></div>`;
      }).join("")}</section>`;
    }).join("");
    document.body.appendChild(g);
    return g;
  }

  /* 1.11.1: your companion does the AI work With a companion out */
  const aiName = () => { try { return isOn() && cur ? nameOf(cur) : ""; } catch (e) { return ""; } };
  let faceSig = "", faceHtml = "";
  function faceFor(){
    if (!aiName()) return "";
    const sig = cur.id + "|" + wearOf(cur) + "|" + JSON.stringify(cfg().tint || {}) + "|" + nameOf(cur);
    if (sig !== faceSig) { faceSig = sig; faceHtml = rigSvg(cur, {eyes: "happy", mouth: "smile", wear: wearOf(cur)}).replace(/<g class="cp-zs">[\s\S]*?<\/g>/, ""); }
    return faceHtml;
  }
  // Each copy of the face gets its own gradient and clip ids
  let faceN = 0;
  const faceIds = html => { const n = "f" + (++faceN); return html.replace(/\bid="([^"]+)"/g, (m, id) => `id="${id}-${n}"`).replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}-${n})`).replace(/href="#([^"]+)"/g, (m, id) => `href="#${id}-${n}"`); };
  function swapFaces(root){
    const html = faceFor();
    const icons = (root || document).querySelectorAll ? (root || document).querySelectorAll("svg.ai-ic:not(.cp-ai-keep)") : [];
    if (!html) { document.querySelectorAll(".cp-ai-face").forEach(el => { const sv = el.querySelector(":scope > svg.ai-ic-orig"); if (sv) { sv.classList.remove("ai-ic-orig"); sv.classList.add("ai-ic"); el.replaceWith(sv); } else el.remove(); }); return; }
    icons.forEach(ic => {
      if (ic.closest(".cp-ai-face")) return;
      const w = document.createElement("span");
      w.className = "ai-ic cp-ai-face"; w.setAttribute("aria-hidden", "true"); w.title = aiName();
      w.style.setProperty("--cp-wear", wearColor(cur));
      w.innerHTML = faceIds(html);
      ic.replaceWith(w);
      ic.classList.remove("ai-ic"); ic.classList.add("ai-ic-orig"); ic.style.display = "none"; w.appendChild(ic);
    });
    document.querySelectorAll(".cp-ai-face").forEach(el => { if (el.dataset.sig !== faceSig) { const orig = el.querySelector(":scope > svg.ai-ic-orig"); el.innerHTML = faceIds(html); if (orig) el.appendChild(orig); el.dataset.sig = faceSig; el.title = aiName(); el.style.setProperty("--cp-wear", wearColor(cur)); } });
  }
  function faceSwapNow(){ try { swapFaces(document); } catch (e) {} faceSoon(); }
  let faceQ = 0;
  const faceSoon = () => { if (faceQ) return; faceQ = 1; queueMicrotask(() => { faceQ = 0; try { swapFaces(document); } catch (e) {} }); };
  try { new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches("svg.ai-ic") || n.querySelector("svg.ai-ic"))) { faceSoon(); return; } }).observe(document.documentElement, {childList: true, subtree: true}); } catch (e) {}
  hook("render", () => faceSoon());
  // Starting an AI task yourself
  const WORKING = ["On it! Give me a sec!", "Ooh, I can do that! Working on it!", "Leave it to me! Thinking hard!", "Yes! Let me work my magic!"];
  const READY = ["All done! Take a look!", "Ta-da! Here you go!", "Finished! I think you'll like it!", "Done and done! Check it out!"];
  const OOPS = ["Hmm, that didn't work. Want to try again?", "Oops, I got stuck. Can we try that again?"];
  let cpAiBusy = 0, cpAiTalkT = 0;
  try {
    const origAI = aiCall;
    aiCall = async function(o){
      const mine = !(o && o.auto) && !!aiName() && talkOn();
      if (!mine) return origAI.apply(this, arguments);
      cpAiBusy++;
      clearTimeout(cpAiTalkT);
      cpAiTalkT = setTimeout(() => { if (cpAiBusy && act && !quietNow2()) { say(pickFrom("ai:work", WORKING), {ms: 3200}); act.eyes("open"); act.look(0, -0.7); act.motion(act.has("armL") || act.has("armR") ? "wave" : "hop"); } }, 500);
      try {
        const r = await origAI.apply(this, arguments);
        cpAiBusy = Math.max(0, cpAiBusy - 1);
        if (!cpAiBusy) { clearTimeout(cpAiTalkT); setTimeout(() => { if (act && !quietNow2()) { lastCheer = 0; cheer("task"); say(pickFrom("ai:ready", READY), {cheer: true, ms: 3600}); } }, 300); }
        return r;
      } catch (e) {
        cpAiBusy = Math.max(0, cpAiBusy - 1);
        clearTimeout(cpAiTalkT);
        if (!cpAiBusy && act && !quietNow2() && !(e && /abort|cancel/i.test(String(e.code || e.name || e.message || "")))) say(pickFrom("ai:oops", OOPS), {ms: 4000});
        throw e;
      }
    };
  } catch (e) { console.warn("companion ai", e); }
  // Like quietNow, but a dialog being open is fine (most AI work starts from one)
  const quietNow2 = () => !isOn() || !talkOn() || !cur || !box || box.hidden || document.hidden;

  window.SBCOMP = {
    aiName, face: () => faceFor(),
    // For the Companion tab's Wardrobe
    wardrobe: () => { try { const b = pickerBody(), i = b.indexOf('<h3 class="fsec">Accessories</h3>'), j = b.indexOf('<h3 class="fsec">Options</h3>'); if (i < 0) return ""; let w = b.slice(i, j > i ? j : undefined); const k = w.indexOf('<h3 class="fsec">How to Earn More</h3>'); if (k >= 0) w = w.slice(0, k) + '<details class="cpt3-how"><summary>How to Earn More</summary>' + w.slice(k + '<h3 class="fsec">How to Earn More</h3>'.length) + '</details>'; return w; } catch (e) { return ""; } },
    wearColor: () => { try { const c = current(); return c ? wearColor(c) : ""; } catch (e) { return ""; } },
    wornNames: () => { try { const c = current(); return c ? wearOf(c).map(id => (ACC.find(a => a.id === id) || {}).name).filter(Boolean) : []; } catch (e) { return []; } },
    // A close-up of the face (a headshot, for small round pictures)
    head: (id, o) => {
      const c = id ? BYID[id] : cur; if (!c) return "";
      const svg = rigSvg(c, Object.assign({eyes: "happy", mouth: "smile", wear: c === cur ? wearOf(c) : []}, o)).replace(/<g class="cp-zs">[\s\S]*?<\/g>/, "");
      const ey = num(c.eyes && c.eyes.y) ? c.eyes.y : 60, size = 90, y = Math.max(0, Math.min(VB - size, ey - 50));
      return svg.replace(`viewBox="0 0 ${VB} ${VB}"`, `viewBox="${(VB - size) / 2} ${f1(y)} ${size} ${size}"`);
    },
    check, gallery, rigSvg: (id, o) => BYID[id] ? rigSvg(BYID[id], o) : "", stillUrl: id => BYID[id] ? stillUrl(BYID[id]) : "", wearColorOf: id => BYID[id] ? wearColor(BYID[id]) : "",
    themes: () => Object.keys(REG), list: k => (REG[k] ? REG[k].list : []).map(c => ({id: c.id, name: c.name, kind: c.kind, pose: c.pose})),
    // Every companion, for the Your Photo theme editor's "Companions" picker
    all: () => Object.keys(REG).flatMap(k => REG[k].list.map(c => ({id: c.id, name: c.name, kind: c.kind || "", theme: k, owned: canComp(c)}))),
    current: () => current() && current().id, mood: () => mood, el: () => box, open: openPicker,
    tap: () => react(), cheer: k => { lastCheer = 0; cheer(k || "task"); }, greet: () => { try { sessionStorage.removeItem(GREET_KEY); } catch (e) {} greet(); },
    say: (t, o) => say(t, Object.assign({again: true}, o)),
    // A trip to a corner or any point (clamped into the allowed range), in a chosen style
    trip: (x, y, style) => {
      if (!box || !cur) return false;
      const px = +box.dataset.px, rg = range(px, true), from = {left: +box.dataset.x, top: +box.dataset.y};
      const to = {left: Math.round(Math.max(rg.L, Math.min(rg.R, x))), top: Math.round(Math.max(rg.T, Math.min(rg.B, y))), kind: "ground", px};
      box.style.left = to.left + "px"; box.style.top = to.top + "px"; box.dataset.x = to.left; box.dataset.y = to.top; homeSig = [to.left, to.top, px].join(",");
      travel(from, to, px, style); return true;
    },
    range: () => cur ? range(sizePx(cur), true) : null,
    clamp: why => clamp(why || "api"), safe: () => safeRect(true), bounds: () => { const V = visual(), b = front && front.querySelector(".cp-bubble.on"), r = b && b.getBoundingClientRect(); return {visual: V, safe: safeRect(true), bubble: r ? r.toJSON() : null, hit: box ? box.querySelector(".cp-hit").getBoundingClientRect().toJSON() : null, shrink, fixes: guardFixes, last: guardLast, ext: vext, range: cur ? range(sizePx(cur), true) : null, fab: fabRect(), over: box ? box.dataset.over : "", spot: box ? box.dataset.spot : "", hitOff: box ? box.querySelector(".cp-hit").classList.contains("cp-hit-off") : false}; },
    hit: (x, y) => ours(x, y), refresh: () => { curSig = ""; build(); }, place: fresh => { passCacheReset(); homeSig = ""; place(fresh !== false); },
    motion: n => act && act.motion(n), ACC: ACC.map(a => Object.assign({}, a)), IDLES: Object.keys(IDLES),
    wearing: () => cur ? wearOf(cur).join("_") : "", hours,
    _actor: (id, el) => BYID[id] ? actor(BYID[id], el, {}) : null,
    // For tests
    settings: () => JSON.parse(JSON.stringify(cfg())), setCfg: patch => { setCfg(patch); curSig = ""; build(); },
    setSkin: id => { state.settings = Object.assign({}, state.settings, {style: Object.assign({}, state.settings.style, {skin: id, skinAt: Date.now()})}); saveSettings(); applySkin(); },
    plan: () => ({paywall: paywall(), pro: pro()}), pomoMinutes: () => Number((state.settings.pomo || {}).focus) || 25,
    home: () => ({home, rect: box && !box.hidden ? box.getBoundingClientRect().toJSON() : null}),
    brain: () => ({mood, energy: BR.energy, taskDone: BR.taskDone && BR.taskDone.title, context: contextKinds()}),
    ai: () => aiRead(), aiRun: force => aiMaybe("test", !!force), think, idle: ms => { BR.input = Date.now() - ms; think(); },
    _speech: SPEECH, _speechGuard: speechGuard, line: () => tapLine(), idea: () => ideaNow(), offer: () => { const i = ideaNow(); if (i) say(i.text, {idea: i, ask: askAvailable()}); return i ? i.text : ""; },
    peek: () => screenPeek(), askScreen: async q => aiAsk(q, await screenCtx()),
    usage: () => aiUsage(), flush: () => aiFlush(), queue: m => queueMoment(m), ask: q => aiAsk(q), askOpen: () => { say("Hi!", {ask: askAvailable()}); openAsk(); }, askAvailable: () => askAvailable(),
    setPomo: min => { state.settings = Object.assign({}, state.settings, {pomo: Object.assign({}, state.settings.pomo, {focus: min})}); saveSettings(); },
    chatTick: () => chatTick(true), bubble: () => { const b = front && front.querySelector(".cp-bubble.on"); return b ? b.textContent : ""; },
    openTask: () => { const t = Object.values(state.tasks).find(x => x.status !== "done"); return t ? t.id : ""; },
    // For the Companion tab
    tab: {
      pickerBody, wirePreviews, stopPreviews,
      faceHtml: px => { const c = current(); return c && isOn() ? `<div class="cpt-face cpt-face-slot" data-id="${esc(c.id)}" aria-hidden="true"></div>` : ""; },
      info: () => { const c = current(); return c && isOn() ? {id: c.id, name: nameOf(c), kind: c.kind || "", bio: c.bio || ""} : null; }
    }
  };
})();


