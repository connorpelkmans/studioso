// node tools/capture-store-screens.js [outDir] [names...]   e.g. node tools/capture-store-screens.js 05-whiteboards crunch 00-banner
// Microsoft Store listing screenshots (the Store takes at most 10): a 3840x2160 banner (tools/store-banner.html), then nine app screens
// at 1920x1080, each in its own theme, with the app tour's sample semester on Tuesday, Oct 20 (no AI key, nothing sent anywhere),
// and four alternates (alternates/) to swap in for any of them.
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
// an argument that names a screen (or 00-banner) picks it; any other is the folder to save into
const ARGS = process.argv.slice(2), isName = a => a === "00-banner" || /^(\d\d-[a-z-]+|schedule|crunch|courses|companion)$/.test(a);
const root = path.join(__dirname, ".."), OUT = ARGS.find(a => a && !isName(a)) || path.join(root, "build-resources/msstore-listing/screenshots");
fs.mkdirSync(OUT, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (p === "/index.html" && /[?&]pro=off\b/.test(q.url)) { r.writeHead(200, {"content-type": "text/html"}); r.end(require("../scripts/csp").apply(require("../scripts/app-files").source().replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });

const NOW = new Date(2026, 9, 20, 8, 50, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const D = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const now = NOW.getTime();
// The same sample semester as the app tour (src/js/49-apptour.js demoPlanner)
const T = (id, title, c, type, due, o) => Object.assign({id: "demo-" + id, title, courseId: "demo-" + c, type, start: D(-3), due, time: "", priority: "med", status: "todo", notes: "", hours: 2,
  checklist: [], pct: 0, dependsOn: [], history: [], created: now, order: 10}, o || {});
const SEED = {v: 2,
  courses: [
    {id: "demo-bio", name: "Anatomy & Physiology", code: "BIOL 1200", color: "#1E9E74", meetings: [{id: "m1", kind: "Lecture", days: [1, 3], start: "09:30", end: "11:20", where: "SW1 2015"}, {id: "m2", kind: "Lab", days: [4], start: "13:30", end: "16:20", where: "Lab B"}]},
    {id: "demo-psy", name: "Intro to Psychology", code: "PSYC 1010", color: "#3B6FE0", meetings: [{id: "m3", kind: "Lecture", days: [2, 4], start: "11:30", end: "12:50", where: "Hall C"}]},
    {id: "demo-eng", name: "Academic Writing", code: "ENGL 1100", color: "#D9661F", meetings: [{id: "m4", kind: "Seminar", days: [5], start: "10:00", end: "11:50", where: "Room 214"}]}],
  tasks: [
    T("t1", "Research Essay Draft", "eng", "Assignment", D(2), {time: "23:59", weight: 20, pct: 40, status: "doing", hours: 4, checklist: [{id: "a", text: "Outline", done: true}, {id: "b", text: "Find 5 sources", done: true}, {id: "c", text: "Write body", done: false}]}),
    // the midterm on Friday afternoon (the banner says "Midterm Friday!")
    T("t2", "Midterm Exam", "bio", "Exam", D(3), {time: "13:30", weight: 30, hours: 6, location: "SW1 1020"}),
    T("t3", "Chapter 6 Quiz", "psy", "Quiz", D(1), {time: "23:00", weight: 5, hours: 1}),
    T("t4", "Lab Report: Heart Rate", "bio", "Lab", D(8), {weight: 10, hours: 3}),
    T("t5", "Read Chapter 7", "psy", "Reading", D(3), {hours: 1}),
    T("t6", "Discussion Post 4", "eng", "Assignment", D(-1), {weight: 2, hours: 1}),
    T("t7", "Group Presentation", "psy", "Project", D(16), {weight: 20, hours: 5}),
    T("t8", "Final Exam", "bio", "Exam", D(40), {weight: 35, hours: 10}),
    T("t9", "Chapter 5 Quiz", "psy", "Quiz", D(-6), {status: "done", doneAt: now - 6 * 864e5, pct: 100, mark: {got: 22, outOf: 25}, weight: 5}),
    T("t10", "Lab Report: Cells", "bio", "Lab", D(-9), {status: "done", doneAt: now - 8 * 864e5, pct: 100, mark: {got: 46, outOf: 50}, weight: 10}),
    T("t11", "Essay Outline", "eng", "Assignment", D(-4), {status: "done", doneAt: now - 4 * 864e5, pct: 100, mark: {got: 81, outOf: 100}, weight: 5})],
  events: [{id: "demo-e1", title: "Study Group", courseId: "demo-bio", date: D(2), start: "15:00", end: "16:30", allDay: false, where: "Library", created: now},
    {id: "demo-e2", title: "Part-time Shift", date: D(4), start: "12:00", end: "17:00", allDay: false, created: now}],
  notes: [{id: "demo-n1", text: "Ask about the midterm review session", created: now, courseId: "demo-bio", color: "yellow", x: 540, y: 330, rot: -2, pin: "pin", stickers: [{k: "fstar", x: 84, y: 76, r: 14}]},
    {id: "demo-n2", text: "Essay: find one more peer-reviewed source", created: now - 1000, courseId: "demo-eng", color: "pink", x: 400, y: 90, rot: 2, pin: "tape", stickers: [{k: "pencil", x: 82, y: 80, r: 12}]},
    {id: "demo-n3", text: "Bring calculator Thursday", created: now - 2000, color: "blue", x: 610, y: 40, rot: -1, pin: "pin", stickers: [{k: "think", x: 82, y: 74, r: 8}]}],
  decks: [{id: "demo-d1", name: "Heart Terms", courseId: "demo-bio", cards: [{id: "k1", front: "Systole", back: "When the heart contracts"}, {id: "k2", front: "Diastole", back: "When the heart relaxes and fills"},
    {id: "k3", front: "Preload", back: "How stretched the heart is before it contracts"}, {id: "k4", front: "Afterload", back: "The pressure the heart pushes against"}], quizzes: [], aiQuizzes: []},
    {id: "demo-d2", name: "Memory and Learning", courseId: "demo-psy", cards: [{id: "k5", front: "Encoding", back: "Getting information into memory"}, {id: "k6", front: "Retrieval", back: "Getting it back out"}], quizzes: [], aiQuizzes: []}],
  files: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};

/* Whiteboard: an Anatomy board drawn as the app saves it (strokes packed like 99-whiteboard.js enc(), typed text as items) */
const WB = (() => {
  const AL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const enc = pts => { let s = "", px = 0, py = 0; const put = v => { v = v < 0 ? -v * 2 - 1 : v * 2; while (v >= 32) { s += AL[32 + (v % 32)]; v = Math.floor(v / 32); } s += AL[v]; };
    pts.forEach(([x, y]) => { const X = Math.round(x * 4), Y = Math.round(y * 4); put(X - px); put(Y - py); px = X; py = Y; }); return s; };
  // a steady hand: a slow wobble, the same every run
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const wob = (pts, amt) => { const ph = rnd() * 6, f = 0.004 + rnd() * 0.004; let L = 0; return pts.map((p, i) => { if (i) L += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); return [p[0] + Math.sin(L * f + ph) * amt, p[1] + Math.cos(L * f * 1.3 + ph) * amt]; }); };
  const line = (a, b, n) => { const o = []; n = n || Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14)); for (let i = 0; i <= n; i++) o.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return o; };
  const quad = (a, c, b) => { const o = []; for (let i = 0; i <= 40; i++) { const t = i / 40, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };
  const S = [], I = []; let n = 0;
  const pen = (c, w, pts, amt) => S.push({id: "wbs" + (++n), t: "pen", c, w: w * 10, d: enc(wob(pts, amt == null ? 3 : amt)), at: now});
  const hl = (c, w, pts) => S.push({id: "wbs" + (++n), t: "hl", c, w: w * 10, d: enc(wob(pts, 2)), at: now});
  const text = (x, y, s, c, f, ff) => I.push({id: "wbt" + (++n), k: "t", x, y, s, c, f, ff: ff || "neat", at: now});
  // an arrow: a gentle curve, then its head drawn as one more stroke
  const arrow = (c, w, a, b, bend) => { const m = [(a[0] + b[0]) / 2 + (bend || 0) * (b[1] - a[1]) / 4, (a[1] + b[1]) / 2 - (bend || 0) * (b[0] - a[0]) / 4], body = quad(a, m, b);
    pen(c, w, body, 2); const p = body[body.length - 4], an = Math.atan2(b[1] - p[1], b[0] - p[0]), h = 46;
    pen(c, w, [[b[0] - h * Math.cos(an - 0.5), b[1] - h * Math.sin(an - 0.5)], b, [b[0] - h * Math.cos(an + 0.5), b[1] - h * Math.sin(an + 0.5)]], 0); };
  // the heart: the classic heart curve, tipped like the real one, with its septum and the line between atria and ventricles
  const cx = 1300, cy = 1300, k = 26, tilt = -0.2;
  const rot = ([x, y]) => [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)];
  const heart = t => [16 * Math.pow(Math.sin(t), 3) * k, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k];
  const outline = []; for (let i = 0; i <= 160; i++) outline.push(rot(heart(i / 160 * Math.PI * 2)));
  pen("red", 12, outline, 4);
  pen("red", 9, quad(rot([0, -5 * k]), rot([2 * k, 6 * k]), rot([0, 16.2 * k])), 3);
  const across = y => { const pts = []; for (let i = 0; i <= 160; i++) pts.push(heart(i / 160 * Math.PI * 2));
    const xs = []; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) xs.push(p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1])); }); return [Math.min(...xs), Math.max(...xs)]; };
  const [l0, r0] = across(1 * k); pen("red", 9, quad(rot([l0 + 6, 1 * k]), rot([0, 3 * k]), rot([r0 - 6, 1 * k])), 2);
  // chambers
  text(cx - 300, cy - 180, "RA", "blue", 110, "marker"); text(cx + 90, cy - 290, "LA", "red", 110, "marker");
  text(cx - 210, cy + 90, "RV", "blue", 110, "marker"); text(cx + 110, cy + 10, "LV", "red", 110, "marker");
  // the lungs, the body and the vessels between them
  pen("green", 10, (() => { const o = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; o.push([cx - 30 + Math.cos(a) * 280, cy - 600 + Math.sin(a) * 105]); } return o; })(), 4);
  text(cx - 160, cy - 660, "LUNGS", "green", 92, "marker");
  arrow("blue", 10, [cx - 330, cy - 300], [cx - 230, cy - 500], 0.25); text(cx - 720, cy - 540, "pulmonary\nartery", "blue", 72, "quick");
  arrow("red", 10, [cx + 170, cy - 500], [cx + 210, cy - 330], 0.3); text(cx + 290, cy - 560, "pulmonary\nveins", "red", 72, "quick");
  arrow("blue", 10, [cx - 840, cy - 120], [cx - 470, cy - 110], -0.15); text(cx - 860, cy - 250, "vena cava", "blue", 72, "quick");
  text(cx - 860, cy - 60, "(from the body)", "ink", 54, "quick");
  arrow("red", 10, [cx + 420, cy + 10], [cx + 760, cy - 110], 0.2); text(cx + 520, cy - 230, "aorta", "red", 72, "quick"); text(cx + 560, cy + 60, "to the body", "ink", 54, "quick");
  // title, underlined
  text(cx - 860, cy - 950, "The Heart: How Blood Flows", "ink", 124, "marker");
  pen("orange", 11, line([cx - 850, cy - 775], [cx + 1020, cy - 790]), 3);
  // the valves, in a box
  const vx = cx + 980, vy = cy - 600;
  text(vx, vy, "4 valves, in order", "purple", 80, "hand");
  text(vx, vy + 120, "1. Tricuspid   RA → RV\n2. Pulmonary  RV → lungs\n3. Mitral         LA → LV\n4. Aortic         LV → body", "ink", 62, "neat");
  pen("purple", 8, [[vx - 40, vy - 30], [vx + 760, vy - 36], [vx + 766, vy + 470], [vx - 34, vy + 476], [vx - 40, vy - 30]], 2);
  // a highlighted note and a key
  text(vx - 20, vy + 600, "LV wall is the thickest:\nit pumps to the whole body!", "ink", 66, "hand");
  hl("yellow", 56, line([vx - 20, vy + 652], [vx + 620, vy + 652]));
  hl("yellow", 56, line([vx - 20, vy + 738], [vx + 700, vy + 738]));
  pen("blue", 14, line([vx, vy + 900], [vx + 130, vy + 900]), 1); text(vx + 160, vy + 860, "low O₂", "ink", 62, "neat");
  pen("red", 14, line([vx + 400, vy + 900], [vx + 530, vy + 900]), 1); text(vx + 560, vy + 860, "high O₂", "ink", 62, "neat");
  // a reminder in a box, with a star
  text(cx - 840, cy + 300, "Midterm Friday!\nRA → RV → lungs\n→ LA → LV → aorta", "orange", 66, "fun");
  pen("orange", 8, [[cx - 880, cy + 270], [cx - 270, cy + 264], [cx - 266, cy + 560], [cx - 876, cy + 566], [cx - 880, cy + 270]], 2);
  const star = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 28 : 66; star.push([cx - 170 + Math.cos(a) * r, cy + 330 + Math.sin(a) * r]); } pen("orange", 8, star, 1);
  return {wbInk: S, wbItems: I};
})();

/* Writing Studio: the research essay in APA, with a draft that has a few things to fix */
const WS_SRC = [
  {id: "s1", type: "book", title: "Why we sleep: Unlocking the power of sleep and dreams", author: [{family: "Walker", given: "Matthew"}], issued: {"date-parts": [[2017]]}, publisher: "Scribner"},
  {id: "s2", type: "article-journal", title: "Sleep deprivation in adolescents and adults: Changes in the sleep and circadian rhythms", author: [{family: "Carskadon", given: "Mary A."}], issued: {"date-parts": [[2011]]}, "container-title": "Pediatric Clinics of North America", volume: "58", issue: "3", page: "637–647", DOI: "10.1016/j.pcl.2011.03.003"},
  {id: "s3", type: "article-journal", title: "Screen time and sleep among school-aged children and adolescents: A systematic literature review", author: [{family: "Hale", given: "Lauren"}, {family: "Guan", given: "Stanford"}], issued: {"date-parts": [[2015]]}, "container-title": "Sleep Medicine Reviews", volume: "21", page: "50–58", DOI: "10.1016/j.smrv.2014.07.007"},
  {id: "s4", type: "article-journal", title: "The association between social media use and sleep disturbance among young adults", author: [{family: "Levenson", given: "Jessica C."}, {family: "Shensa", given: "Ariel"}, {family: "Sidani", given: "Jaime E."}, {family: "Colditz", given: "Jason B."}, {family: "Primack", given: "Brian A."}], issued: {"date-parts": [[2016]]}, "container-title": "Preventive Medicine", volume: "85", page: "36–41", DOI: "10.1016/j.ypmed.2016.01.001"},
  {id: "s5", type: "article-journal", title: "Evening use of light-emitting eReaders negatively affects sleep, circadian timing, and next-morning alertness", author: [{family: "Chang", given: "Anne-Marie"}, {family: "Aeschbach", given: "Daniel"}, {family: "Duffy", given: "Jeanne F."}, {family: "Czeisler", given: "Charles A."}], issued: {"date-parts": [[2015]]}, "container-title": "Proceedings of the National Academy of Sciences", volume: "112", issue: "4", page: "1232–1237", DOI: "10.1073/pnas.1418490112"}];
const WS_DRAFT = `Screens, Sleep and the First-Year Student

Most first-year students go to bed with a phone in hand, and their sleep pays for it. Teenagers' body clocks already shift later in adolescence (Carskadon, 2011), so a late night of scrolling pushes bedtime even further back. A review of 67 studies found that screen time was linked to later bedtimes and shorter sleep in 90% of them (Hale & Guan 2015).

The light itself matters. Reading on a tablet before bed delayed melatonin and left readers less alert the next morning (Chang et al., 2015, p. 1233). Young adults who checked social media most often were also the most likely to report disturbed sleep (Levenson et al, 2016). Walker (2017) argues that "sleep is the single most effective thing we can do to reset our brain and body health each day" (p. 107).

Students who protect their sleep do better in class (Hershner & Chervin, 2014). Hale and Guan (2015) suggest a simple rule: screens off an hour before bed.

References
Carskadon, M. A. (2011). Sleep deprivation in adolescents and adults: Changes in the sleep and circadian rhythms. Pediatric Clinics of North America, 58(3), 637–647. https://doi.org/10.1016/j.pcl.2011.03.003
Chang, A.-M., Aeschbach, D., Duffy, J. F., & Czeisler, C. A. (2015). Evening use of light-emitting eReaders negatively affects sleep, circadian timing, and next-morning alertness. Proceedings of the National Academy of Sciences, 112(4), 1232–1237. https://doi.org/10.1073/pnas.1418490112
Hale, L., & Guan, S. (2015). Screen time and sleep among school-aged children and adolescents: A systematic literature review. Sleep Medicine Reviews, 21, 50–58. https://doi.org/10.1016/j.smrv.2014.07.007
Hershner, S. D., & Chervin, R. D. (2014). Causes and consequences of sleepiness among college students. Nature and Science of Sleep, 6, 73–84. https://doi.org/10.2147/NSS.S62907
Levenson, J. C., Shensa, A., Sidani, J. E., Colditz, J. B., & Primack, B. A. (2016). The association between social media use and sleep disturbance among young adults. Preventive Medicine, 85, 36–41. https://doi.org/10.1016/j.ypmed.2016.01.001
Walker, M. (2017). Why we sleep: Unlocking the power of sleep and dreams. Scribner.`;

// what doi.org answers for the one entry in the draft's list that isn't a source yet (answered here, not fetched)
const DOI_CSL = {DOI: "10.2147/NSS.S62907", type: "journal-article", title: "Causes and consequences of sleepiness among college students", "container-title": "Nature and Science of Sleep", volume: "6", page: "73-84", author: [{given: "Sara D.", family: "Hershner"}, {given: "Ronald D.", family: "Chervin"}], issued: {"date-parts": [[2014]]}};

/* Concept map: the cardiovascular system for Anatomy, with styled boxes and a video box */
// the blood's loop around the outside (right heart, lungs, left heart, body), the heart in the middle
const CM_POS = {root: [0, -150], "idea:heart": [0, 40], "idea:valves": [0, 210], "idea:ra": [-640, 60], "idea:rv": [-500, -220], "idea:lungs": [0, -360], "idea:la": [500, -220], "idea:lv": [640, 60],
  "idea:aorta": [500, 300], "idea:arteries": [190, 400], "idea:caps": [-190, 400], "idea:veins": [-500, 300], "idea:co": [960, -160], "idea:vid": [960, 250]};
const CM_MAP = {id: "cm-cv", name: "Cardiovascular System", auto: false, created: now - 5 * 864e5, at: now - 3600e3, pack: "med",
  add: [{id: "heart", label: "Heart"}, {id: "ra", label: "Right atrium"}, {id: "rv", label: "Right ventricle"}, {id: "lungs", label: "Lungs"}, {id: "la", label: "Left atrium"}, {id: "lv", label: "Left ventricle"},
    {id: "aorta", label: "Aorta"}, {id: "arteries", label: "Arteries"}, {id: "caps", label: "Capillaries"}, {id: "veins", label: "Veins"}, {id: "valves", label: "4 valves"}, {id: "co", label: "Cardiac output = HR × SV"},
    {id: "vid", label: "", emb: {p: "youtube", u: "https://www.youtube.com/watch?v=sbStoreDemo1", e: "https://www.youtube-nocookie.com/embed/sbStoreDemo1?rel=0", th: "https://i.ytimg.com/vi/sbStoreDemo1/hqdefault.jpg"}}],
  links: [{a: "root", b: "idea:heart", label: "pumped by"}, {a: "idea:heart", b: "idea:valves", label: "keeps blood one-way with"}, {a: "idea:ra", b: "idea:rv", label: "tricuspid valve"}, {a: "idea:rv", b: "idea:lungs", label: "pulmonary artery"},
    {a: "idea:lungs", b: "idea:la", label: "pulmonary veins"}, {a: "idea:la", b: "idea:lv", label: "mitral valve"}, {a: "idea:lv", b: "idea:aorta", label: "aortic valve"}, {a: "idea:aorta", b: "idea:arteries", label: "branches into"},
    {a: "idea:arteries", b: "idea:caps", label: "exchange O₂"}, {a: "idea:caps", b: "idea:veins", label: "collect into"}, {a: "idea:veins", b: "idea:ra", label: "vena cava"},
    {a: "idea:lv", b: "idea:co", label: "sets"}, {a: "idea:vid", b: "idea:lv", label: "watch"}],
  pos: Object.fromEntries(Object.entries(CM_POS).map(([k, [x, y]]) => [k, [Math.round(x * 0.8), Math.round(y * 0.78)]])),
  styles: {root: {shape: "pill", color: "#C8102E", scale: 1.3}, "idea:heart": {shape: "circle", color: "#C8102E", scale: 1.25}, "idea:lungs": {shape: "cloud", color: "#2E8A52"}, "idea:co": {shape: "rounded", color: "#7A3CC8"}, "idea:valves": {shape: "hexagon", color: "#E57A10"},
    "idea:ra": {color: "#1D5BD6"}, "idea:rv": {color: "#1D5BD6"}, "idea:veins": {color: "#1D5BD6"}, "idea:la": {color: "#C8102E"}, "idea:lv": {color: "#C8102E"}, "idea:aorta": {color: "#C8102E"}, "idea:arteries": {color: "#C8102E"}}};

/* Each screen: [file, theme, light/dark, how to get there, extra (seed: change the semester, setup: after getting there, dir: "alternates")]
   The Microsoft Store takes at most 10 desktop screenshots: the banner and the nine below; the four after them are alternates. */
const SHOTS = [
  ["01-today", "classic", "light", ["Board", "Today's Plan"]],
  ["02-taskboard", "sakura", "light", ["Board", "Task Board"]],
  ["03-timeline", "galaxy", "dark", ["Calendar", "Due Dates", "Timeline", "Term"]],
  ["04-notes", "spring", "light", ["Notes", "Notes"], {seed: s => s.notes.push(
    {id: "demo-n4", text: "Ch. 7: encoding → storage → retrieval", created: now - 3000, courseId: "demo-psy", color: "green", x: 40, y: 70, rot: 2, pin: "tape", stickers: [{k: "brain", x: 82, y: 78, r: -8}]},
    {id: "demo-n5", text: "Lab Thursday 1:30: lab coat and goggles", created: now - 4000, courseId: "demo-bio", color: "orange", x: 150, y: 330, rot: -3, pin: "pin", stickers: [{k: "flask", x: 84, y: 78, r: 10}]})}],
  ["05-whiteboards", "candy", "light", ["Notes", "Whiteboard"], {
    seed: s => { s.notes.push(Object.assign({id: "demo-wb1", text: "Heart: Blood Flow", wb: {v: 1, tpl: "blank", pa: 1.6}, courseId: "demo-bio", board: "", created: now - 2 * 864e5, updated: now - 3600e3}, WB)); },
    setup: async page => { await page.click('[data-wb="fit"]'); await page.waitForTimeout(600);
      // move the drawing down a little, clear of the zoom buttons (with the Move tool, as a person would), then back to the marker
      await page.click('.wb-tray [data-wb="tool"][data-id="hand"]'); const r = await page.locator(".wb-frame").boundingBox();
      await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down(); await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2 + 22, {steps: 8}); await page.mouse.up();
      await page.click('.wb-tray [data-wb="tool"][data-id="pen"]'); await page.mouse.move(1270, 700); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(400); }}],
  ["06-concept-maps", "neon", "dark", ["Review"], {
    seed: s => { s.courses[0].maps = [CM_MAP]; },
    setup: async page => { await page.click('[data-act="rv-view"][data-id="maps"]'); await page.waitForTimeout(800);
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "cm-open"; b.dataset.id = "demo-bio"; b.dataset.kind = "course"; b.dataset.map = "cm-cv"; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector('.cm-node[data-n="idea:vid"] image.cm-emb-th', {timeout: 10000}).catch(() => console.warn("  the video box has no picture")); await page.waitForTimeout(1200); }}],
  ["07-writing-studio", "reading", "light", ["Board", "Task Board"], {
    seed: s => { const t = s.tasks.find(x => x.id === "demo-t1"); t.title = "Research Essay: Screens and Sleep"; t.notes = "APA 7th edition. 1,200–1,500 words, at least 5 peer-reviewed sources.";
      t.ws = {style: "apa", src: WS_SRC, q: [], out: [], draft: {t: WS_DRAFT, from: "Pasted", at: now - 3 * 3600e3}}; },
    setup: async page => { await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "ws-open"; b.dataset.id = "demo-t1"; b.dataset.wsTo = "check"; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector("#dlg[open] .ws-tab", {timeout: 15000}); await page.waitForTimeout(1500);
      await page.locator("#dlg[open] button", {hasText: /^Check( Again)?$/}).last().click(); await page.waitForSelector("#dlg[open] .ws-diff", {timeout: 15000}).catch(() => console.warn("  the check didn't run"));
      await page.waitForTimeout(2500);
      // start the view at what the check just did (the draft's card is above it)
      await page.evaluate(() => { const m = [...document.querySelectorAll("#dlg[open] .ws-body *")].find(e => /^Added \d+ source/.test(e.textContent.trim()) && e.children.length < 3); if (m) { m.scrollIntoView({block: "start"}); } });
      await page.waitForTimeout(500); }, zoom: 1.25}],
  ["08-calculator", "cafe", "light", ["Board", "Today's Plan"], {
    // the resting potential of a nerve cell from the Nernst equation (K+ 5 mM outside, 140 mM inside), with the calculator moved to the right
    setup: async page => { await page.evaluate(async () => { SBCALC.open(); SBCALC.put("61.5*log(5/140)"); await SBCALC.press("eq"); const w = SBCALC.win(); w.style.left = (innerWidth - w.offsetWidth - 36) + "px"; w.style.top = (innerHeight - w.offsetHeight - 20) + "px"; }); await page.waitForTimeout(800); }}],
  ["09-grades", "arcade", "dark", ["Courses", "Grades"]],
  ["schedule", "ocean", "light", ["Calendar", "Schedule"], {dir: "alternates"}],
  ["crunch", "arctic", "dark", ["Calendar", "Crunch"], {dir: "alternates"}],
  ["courses", "sunset", "light", ["Courses", "Courses"], {dir: "alternates"}],
  ["companion", "forest", "light", ["Companion", "Wardrobe"], {dir: "alternates", setup: async page => { await page.locator("button", {hasText: "Cozy Scarf"}).first().click().catch(() => console.warn("  no scarf")); await page.waitForTimeout(800); }}]];

const dismiss = async page => {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].filter(b => /^(Not now|No Thanks|Dismiss|Later|Not This Week|Skip|Got It)$/i.test(b.textContent.trim()) && b.offsetParent).forEach(b => b.click());
      document.querySelectorAll("dialog[open] [data-act=close], dialog[open] .x").forEach(b => b.click());
    });
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(250);
  }
};
// Click a nav item first, then tabs inside the page, by their visible label
const go = async (page, labels) => {
  for (let k = 0; k < labels.length; k++) {
    const ok = await page.evaluate(([l, nav]) => {
      const last = l.endsWith("@last"); l = l.replace(/@last$/, "");
      const clean = e => e.textContent.trim().replace(/\s*\d+$/, "");
      const all = [...document.querySelectorAll("button, [role=tab], a")].filter(e => e.offsetParent && clean(e) === l);
      const b = last ? all[all.length - 1] : nav ? all.find(e => e.closest("nav,aside,#nav,.side")) || all[0] : all.find(e => !e.closest("nav,aside,#nav,.side")) || all[0];
      if (b) b.click(); return !!b;
    }, [labels[k], k === 0]);
    if (!ok) console.warn("  no button:", labels[k]);
    await page.waitForTimeout(1200);
  }
};

// a picture for the video box (the map's YouTube link is a made-up one, and nothing is fetched from YouTube: its oEmbed answer and thumbnail are drawn here)
const VIDEO_PIC = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9EC"/><stop offset="1" stop-color="#FFC9D1"/></linearGradient></defs>
  <rect width="480" height="360" fill="url(#g)"/><path d="M240 300C150 240 90 190 90 130c0-40 30-70 70-70 34 0 58 20 80 48 22-28 46-48 80-48 40 0 70 30 70 70 0 60-60 110-150 170z" fill="#E0394E"/>
  <path d="M120 170h70l20-44 30 92 24-62 16 14h80" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
async function shoot(browser, [name, skin, scheme, path_, o]) {
  o = o || {};
  // 1920x1080: 1280x720 at 1.5x, or (zoom: 1.25) 1536x864 at 1.25x for a screen with more to show
  const z = o.zoom || 1.5;
  const ctx = await browser.newContext({viewport: {width: Math.round(1920 / z), height: Math.round(1080 / z)}, colorScheme: scheme, deviceScaleFactor: z, serviceWorkers: "block"});
  await ctx.clock.setFixedTime(NOW);
  // nothing leaves the machine: only the local server answers, and the video box's oEmbed and picture are drawn here
  await ctx.route(/youtube\.com\/oembed/, r => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify({title: "Blood Flow in 3 Minutes", thumbnail_url: "https://i.ytimg.com/vi/sbStoreDemo1/hqdefault.jpg"})}));
  await ctx.route(/doi\.org\/10\.2147/, r => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(DOI_CSL)}));
  await ctx.route(/i\.ytimg\.com/, r => r.fulfill({status: 200, contentType: "image/svg+xml", body: VIDEO_PIC}));
  await ctx.route(u => !/^(http:\/\/localhost|data:|blob:)/.test(String(u)) && !/youtube\.com\/oembed|i\.ytimg\.com|doi\.org\/10\.2147/.test(String(u)), r => r.abort());
  const seed = JSON.parse(JSON.stringify(SEED)); seed.settings.style = {skin}; seed.settings.owned = ["skin:" + skin];
  if (o.seed) o.seed(seed);
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:theme", scheme); localStorage.setItem("studyboard:tips", "off"); } } catch (e) {} }, [seed, scheme]);
  const page = await ctx.newPage();
  await page.goto("http://localhost:" + server.address().port + "/?pro=off"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(3000);
  await page.addStyleTag({content: ".toast,#toast{display:none!important}"});
  await dismiss(page);
  await go(page, path_);
  await dismiss(page);
  if (o.setup) await o.setup(page);
  await page.evaluate(() => { document.querySelectorAll(".cp-bubble.on").forEach(x => x.classList.remove("on")); const a = document.activeElement; if (a && a !== document.body && !a.closest("dialog")) a.blur(); });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const dir = o.dir ? path.join(OUT, o.dir) : OUT; fs.mkdirSync(dir, {recursive: true});
  await page.screenshot({path: path.join(dir, name + ".png")}); console.log("saved", (o.dir ? o.dir + "/" : "") + name + ".png");
  await ctx.close();
}
// The banner: tools/store-banner.html with the new Today screenshot, the app's Packy and two of its stickers, at 4K
const stickerSvg = k => { const src = fs.readFileSync(path.join(root, "src/js/01-remotex.js"), "utf8"), SO = (/const SO = '([^']*)'/.exec(src) || [])[1] || "";
  const m = new RegExp("\\n\\s*" + k + ": `([^`]*)`").exec(src); return m ? m[1].replace(/\$\{SO\}/g, SO) : ""; };
async function banner(browser) {
  const base = "http://localhost:" + server.address().port;
  // Packy, drawn by the app
  const ctx0 = await browser.newContext({serviceWorkers: "block"});
  await ctx0.clock.setFixedTime(NOW);
  await ctx0.addInitScript(() => { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], settings: {comp: {pick: {plain: 4}}}})); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); });
  const p0 = await ctx0.newPage(); await p0.goto(base + "/?pro=off"); await p0.waitForSelector(".cp .cp-svg", {timeout: 10000}); await p0.waitForTimeout(1500);
  const packy = await p0.evaluate(() => { const c = document.querySelector(".cp"); if (!/packy/.test(c.innerHTML)) return ""; const live = c.querySelector(".cp-svg"), s = live.cloneNode(true);
    // keep only what the app shows (its CSS hides the other eyes, mouths and the sleep Zs)
    const a = [...live.querySelectorAll("*")], b = [...s.querySelectorAll("*")];
    a.forEach((e, i) => { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") b[i].setAttribute("data-drop", ""); });
    s.querySelectorAll("[data-drop]").forEach(e => e.remove()); s.removeAttribute("style"); s.removeAttribute("class"); return s.outerHTML; });
  await ctx0.close();
  if (!packy) throw new Error("banner: Packy didn't load");
  const ctx = await browser.newContext({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 2, serviceWorkers: "block"});
  const page = await ctx.newPage(); await page.goto(base + "/tools/store-banner.html");
  const today = "data:image/png;base64," + fs.readFileSync(path.join(OUT, "01-today.png")).toString("base64");
  await page.evaluate(([today, packy, flask, brain]) => { document.getElementById("today").src = today; document.getElementById("packy").innerHTML = packy; document.getElementById("flask").innerHTML = flask; document.getElementById("brain").innerHTML = brain; }, [today, packy, stickerSvg("flask"), stickerSvg("brain")]);
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
  await page.screenshot({path: path.join(OUT, "00-banner.png")}); console.log("saved 00-banner.png");
  await ctx.close();
}

(async () => {
  await new Promise(r => server.listen(0, r)); const browser = await chromium.launch({executablePath});
  const only = ARGS.filter(isName);
  try { for (const s of SHOTS) if (!only.length || only.includes(s[0])) await shoot(browser, s); if (!only.length || only.includes("00-banner")) await banner(browser); }
  finally { await browser.close(); server.close(); }
  console.log("done:", OUT);
})().catch(e => { console.error(e); process.exit(1); });
