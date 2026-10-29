// Shared sample data and helpers for tests/teach-back.e2e.js and tests/exam-sheet.e2e.js: a physics course, a midterm with a prep plan
// whose topics link a deck (formulas, term cards, a picture card), a note with definitions, and lecture cards Exam Prep pulls in by date.
// Served over http with Pro enforcement switched off in the page, as the other Pro tests do; "free" turns the paywall back on for the locked path.
const path = require("path"), http = require("http"), fs = require("fs");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
let BASE = null, SERVER = null;
function serve(){
  if (BASE) return BASE;
  SERVER = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
    const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
    const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml"};
    res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
    if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
    fs.createReadStream(f).pipe(res);
  });
  BASE = new Promise(r => SERVER.listen(0, () => r("http://localhost:" + SERVER.address().port + "/")));
  SERVER.unref();
  return BASE;
}
const NOW = new Date(2026, 9, 4, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const EXAM = plus(10);
const card = (id, front, back, o) => Object.assign({id, front, back, box: 0, due: "", seen: 0, right: 0, wrong: 0}, o || {});
const FBD = {k: "i:fbd", w: 400, h: 300, s: "fbd1", src: "Free-body diagram", mode: "one", m: [[0.42, 0.05, 0.16, 0.1], [0.42, 0.85, 0.16, 0.1], [0.05, 0.45, 0.16, 0.1]]};
const SEED = () => ({v: 2,
  courses: [{id: "c1", name: "Physics", code: "PHYS 101", color: "#3B6FE0"}],
  tasks: [
    {id: "ex1", title: "Midterm", courseId: "c1", type: "Exam", due: EXAM, start: EXAM, time: "09:00", status: "todo", priority: "high",
      prep: {v: 1, topics: [
        {id: "t1", name: "Kinematics", conf: "ok", weight: null, done: false, edited: true, links: [{k: "deck", id: "d1", title: "Mechanics", deckId: "", cardIds: ["k2", "k3", "k5"], total: 3}, {k: "note", id: "n1", title: "Motion definitions", deckId: "", cardIds: null, total: 0}]},
        {id: "t2", name: "Forces", conf: "weak", weight: null, done: false, edited: true, links: [{k: "deck", id: "d1", title: "Mechanics", deckId: "", cardIds: null, total: 12}]},
        {id: "t3", name: "Waves", conf: "ok", weight: null, done: false, edited: true, links: []}],
        intensity: 90, style: [], styleText: "", days: null, rest: false, light: true, start: "", ai: false, examDue: EXAM, createdAt: 1, updatedAt: 1},
      planTopics: [{name: "Kinematics", conf: "ok"}, {name: "Forces", conf: "weak"}, {name: "Waves", conf: "ok"}]},
    {id: "s1", title: "PHYS 101 Midterm: Kinematics (teach-back)", type: "Study", courseId: "c1", start: plus(1), due: plus(1), hours: 0.5, status: "todo", priority: "med", prepFor: "ex1", kind: "teach", topic: "Kinematics", topicId: "t1", studyKind: "teach", notes: "Teach Kinematics out loud.", matKind: "note", matId: "n1", matTitle: "Motion definitions"},
    {id: "s2", title: "PHYS 101 Midterm: Forces (flashcards)", type: "Study", courseId: "c1", start: plus(2), due: plus(2), hours: 0.5, status: "todo", priority: "med", prepFor: "ex1", kind: "cards", topic: "Forces", topicId: "t2", studyKind: "cards", notes: "Review deck Mechanics.", matKind: "deck", matId: "d1", matTitle: "Mechanics", studyDecks: ["d1"]},
    {id: "s3", title: "PHYS 101 Midterm: Waves (learn)", type: "Study", courseId: "c1", start: plus(3), due: plus(3), hours: 0.5, status: "todo", priority: "med", prepFor: "ex1", kind: "learn", topic: "Waves", topicId: "t3", studyKind: "learn", notes: "Read about waves."}],
  decks: [
    {id: "d1", name: "Mechanics", courseId: "c1", created: 1, cards: [
      card("k1", "Newton's second law", "F = ma"),
      card("k2", "Final velocity (constant acceleration)", "v = u + at"),
      card("k3", "Mass-energy equivalence", "$E=mc^2$"),
      card("k4", "Inertia", "Resistance of an object to a change in its motion"),
      card("k5", "What is a vector?", "A quantity with both size and direction"),
      card("k6", "F = ma", "Newton's second law"),
      card("k7", "Unit of force", "Newton"),
      card("k8", "Name the hidden label", "Weight", {img: Object.assign({}, FBD, {i: 0})}),
      card("k9", "Name the hidden label", "Normal force", {img: Object.assign({}, FBD, {i: 1})}),
      card("k10", "Name the hidden label", "Friction", {img: Object.assign({}, FBD, {i: 2})}),
      card("k11", "Draft formula", "x = y + z", {draft: true}),
      card("k12", "Due date for lab", "Friday")]},
    {id: "d2", name: "PHYS 101 Lectures", courseId: "c1", created: 2, cards: [
      card("k20", "Momentum", "p = mv", {from: {k: "note", id: "n3", at: plus(-3)}}),
      card("k21", "Impulse", "The change in momentum of an object, equal to force times time", {from: {k: "note", id: "n3", at: plus(-3)}})]}],
  notes: [
    {id: "n1", courseId: "c1", x: 40, y: 40, rot: 0, color: "yellow", z: 1, text: "Motion definitions\nVelocity — rate of change of displacement\nAcceleration: rate of change of velocity over time\nDue: Friday\nRoom: 4B\nv = u + at\nThe answer = whatever you think"},
    {id: "n3", courseId: "c1", x: 260, y: 40, rot: 0, color: "blue", z: 2, lecAt: plus(-3), text: "Lecture 5: Momentum\nMomentum is mass times velocity, and it is conserved in a closed system."}],
  files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1});

async function mk(browser, w, h, o = {}) {
  const base = await serve();
  const ctx = await browser.newContext({viewport: {width: w, height: h}, serviceWorkers: "block"});
  await ctx.clock.install({time: NOW});
  await ctx.addInitScript(([seed, ai, free]) => {
    try { if (!sessionStorage.getItem("seeded") && !localStorage.getItem("coursework:v2")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed));
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
      if (free) localStorage.setItem("studyboard:paywall-test", "1"); } } catch (e) {}
  }, [o.seed || SEED(), !!o.ai, !!o.free]);
  ctx.aiCalls = [];
  await ctx.route(/generativelanguage\.googleapis\.com/, route => {
    ctx.aiCalls.push(JSON.parse(route.request().postData() || "{}"));
    const r = typeof ctx.aiReply === "function" ? ctx.aiReply() : ctx.aiReply;
    if (r && r.status) { route.fulfill({status: r.status, contentType: "application/json", body: JSON.stringify(r.body || {error: {message: "error"}})}); return; }
    const text = r && r.raw != null ? r.raw : JSON.stringify(r || {});
    route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text}]}, finishReason: "STOP"}]})});
  });
  const page = await ctx.newPage(); page.errs = [];
  page.on("pageerror", e => page.errs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR_/.test(m.text())) page.errs.push(m.text()); });
  await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
  return {ctx, page};
}
const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; x && Object.entries(x).forEach(([k, v]) => { b.dataset[k] = v; }); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
const exam = async page => (await store(page)).tasks.find(t => t.id === "ex1");
const deck = async (page, id) => { const s = await store(page); return (Array.isArray(s.decks) ? s.decks : Object.values(s.decks)).find(d => d.id === id); };
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const dlgScroll = page => page.evaluate(() => { const d = document.querySelector("#dlg"); return d ? d.scrollWidth <= d.clientWidth + 1 : true; });
// A small picture for the picture cards, stored where the app keeps them on this device
const putPicture = page => page.evaluate(async () => {
  const c = document.createElement("canvas"); c.width = 400; c.height = 300; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 400, 300); g.fillStyle = "#3B6FE0"; g.fillRect(150, 100, 100, 100);
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  const db = await new Promise((res, rej) => { const r = indexedDB.open("studioso-fs", 1); r.onupgradeneeded = () => r.result.createObjectStore("h"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  await new Promise(res => { const t = db.transaction("h", "readwrite"); t.objectStore("h").put(blob, "cimg:i:fbd"); t.oncomplete = res; });
});
module.exports = {NOW, plus, EXAM, SEED, mk, act, store, exam, deck, noHScroll, dlgScroll, putPicture};
