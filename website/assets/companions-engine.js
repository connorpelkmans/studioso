/* Studyboard companion drawing and animation, copied from the app (module 98-companion). Do not edit by hand: run tools/make-website-assets.py. */
window.SBCOMPW = (function () {

  // The app's settings and conditions, reduced to what the website needs.
  const cfg = () => ({});
  const skinId = () => "classic";
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const still = () => !!(mq && mq.matches);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const owns = () => true;
  const VB = 120, INK = "#2B2233";
  const DATA = typeof COMP_DATA !== "undefined" ? COMP_DATA : [];
  const GREET_KEY = "studyboard:comp:greeted";

  /* ---------- The rig format ---------- */
  const PIVOT_PARTS = ["tail", "wingL", "wingR", "armL", "armR", "earL", "earR", "top"];
  const STATIC_PARTS = ["back", "feet", "body", "head", "face", "hat"];   // hat: headwear drawn as part of the character; left off while a head accessory is worn (hatTop: true does the same for the top part)
  const POSES = ["stand", "sit", "float"];
  const EYE_STYLES = ["dot", "round", "sparkle"];
  const MOUTH_STYLES = ["smile", "cat"];
  const MOUTH_STATES = ["neutral", "smile", "open", "sleepy"];
  const LINE_KINDS = {tap: 6, pet: 2, hello: 2, morning: 1, night: 1, focus: 2, done: 2, task: 3, break: 1};
  const ANCHORS = ["top", "neck", "chest", "back", "hands"];
  // Signature idles: what each needs ("a|b" = either part, "a,b" = both).
  const IDLES = {
    tailSwish: "tail", earTwitch: "earL|earR", wingFlutter: "wingL,wingR|armL,armR", finWiggle: "armL|armR|tail|wingL|wingR",
    wave: "armL|armR", headTilt: "head", topBob: "top", bounce: "", hop: "", spin: "", sway: "", waddle: "", sparkle: ""
  };
  /* Props (accessories). Each is earned by ANY ONE of its paths: `hours` (lifetime focus hours, the original way, kept as is for
     everyone who already has them) or `paths: [[stat, n], ...]` using the lifetime stats in PROP_STATS below. Once earned a prop is
     remembered in settings.comp.earned and never taken away, even if a stat later drops (a deleted deck, an archived term). */
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
  // How many companions a theme offers: the plain set (used by Classic and every plain colour theme, all free) has 6, every artwork theme has 3.
  const SET_SIZE = th => th === "plain" ? 6 : 3;
  DATA.forEach(t => {
    if (!t || !t.theme || REG[t.theme]) return;
    const list = (Array.isArray(t.companions) ? t.companions : []).slice(0, SET_SIZE(t.theme)).map((c, i) => norm(c, t.theme, i)).filter(Boolean);
    if (!list.length) return;
    REG[t.theme] = {theme: t.theme, spot: t.spot, list};
    list.forEach(c => { if (!BYID[c.id]) BYID[c.id] = c; });
  });
  /* ---------- Drawing ---------- */
  const OUT = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const f1 = n => Math.round(n * 100) / 100;
  function eyeOpen(e, x){
    const r = e.r, c = e.color || INK;
    if (e.style === "round") {
      return `<circle cx="${x}" cy="${e.y}" r="${r}" fill="#fff" ${OUT(2)}/><g class="cp-look"><g class="cp-pupil"><circle cx="${x}" cy="${e.y}" r="${f1(r * 0.6)}" fill="${c}"/><circle cx="${f1(x + r * 0.22)}" cy="${f1(e.y - r * 0.24)}" r="${f1(r * 0.22)}" fill="#fff"/></g></g>`;
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
  // Accessories, drawn around (0,0) at the anchor and scaled by the anchor's third number.
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
  /* Body regions: an item declares the one it covers, and two items can be worn together only when their regions differ.
     Putting one on takes off just the item in the same region. (feet is reserved for future shoes.) */
  const ACC_SLOT = {hat: "head", cap: "head", crown: "head", beanie: "head", glasses: "face", scarf: "neck", bowtie: "neck", star: "chest", medal: "chest", cape: "back"};
  const slotOf = id => ACC_SLOT[id] || id;
  // The colour these were drawn in (the others follow the theme colour); a picked colour replaces either
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

  // Every drawing gets its own ids. The same companion is often drawn several times at once (scene, picker, Style Shop,
  // Study Together), and url(#id) resolves to the first element with that id in the page: if that copy sits in a
  // closed dialog or a hidden list, Chrome paints the fill as nothing and the body turns see-through.
  let uidN = 0;
  function uniqIds(svg){
    const ids = new Set(); svg.replace(/\sid="([^"]+)"/g, (m, id) => { ids.add(id); return m; });
    if (!ids.size) return svg;
    const suf = "-u" + (++uidN).toString(36);
    return svg.replace(/(\sid=")([^"]+)"/g, (m, a, id) => `${a}${id}${suf}"`)
      .replace(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g, (m, id) => ids.has(id) ? `url(#${id}${suf})` : m)
      .replace(/((?:xlink:)?href=")#([^"]+)"/g, (m, a, id) => ids.has(id) ? `${a}#${id}${suf}"` : m);
  }
  // The whole rig as SVG. o: {uid, wear, prop, eyes, mouth, look:[dx,dy], rot:{part: deg}} (the last ones for still previews).
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
    // The cape hangs from the shoulders, centred behind the body (the side-offset "back" anchor was made for a backpack)
    const na = pt(A.neck) ? A.neck : [60, c.neck[1], 1], capeA = [na[0], na[1], f1((num(na[2]) ? na[2] : 1) * 0.95)];
    const chestA = pt(A.chest) ? [A.chest[0], A.chest[1], f1((num(A.chest[2]) ? A.chest[2] : 1) * 1.3)] : A.chest;   // badges read small at the stored chest scale
    const tintOf = id => hexOk(tints[id]) ? tints[id] : "";
    const acc = (id, a) => worn.includes(id) ? `<g class="cp-acc cp-acc-${id}"${tintOf(id) || ACC_DEF[id] ? ` style="--cp-wear:${tintOf(id) || ACC_DEF[id]}"` : ""}>${at(a, ACC_ART[id])}</g>` : "";
    const capePart = art => worn.includes("cape") ? `<g class="cp-acc cp-acc-cape"${tintOf("cape") ? ` style="--cp-wear:${tintOf("cape")}"` : ""}>${at(capeA, art)}</g>` : "";
    const hasHead = !!partSvg(P.head);
    const headWorn = worn.some(id => slotOf(id) === "head");   // a worn hat, cap, crown or beanie replaces the one the character already has
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
    const e = c.eyes, rr = (e.style === "round" ? 0.34 : 0.42) * e.r;
    return uniqIds(svg).replace(/class="cp-look"/g, `class="cp-look" style="transform:translate(${f1(o.look[0] * rr)}px,${f1(o.look[1] * rr)}px)"`);
  }

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
      if (opts.watch) opts.watch(ms);   // the placement guard looks at it every frame while it runs
      running.add(a); a.onfinish = a.oncancel = () => running.delete(a);
      return a;
    };
    const rot = d => ({transform: `rotate(${d}deg)`});
    const side = n => /L$/.test(n) ? 1 : -1;   // left parts raise with positive (clockwise) rotation
    const has = n => !!part(n);
    const armOf = () => has("armR") ? "armR" : has("armL") ? "armL" : "";
    const A = {
      c, root, svg,
      eyes(s){ svg.dataset.e = s || "open"; },
      mouth(s){ svg.dataset.m = s || "neutral"; },
      prop(p){ svg.dataset.prop = p || ""; },
      look(dx, dy){
        const e = c.eyes, rr = (e.style === "round" ? 0.34 : 0.42) * e.r;
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


  return {REG, BYID, rigSvg, actor, GENERIC, partSvg};
})();
