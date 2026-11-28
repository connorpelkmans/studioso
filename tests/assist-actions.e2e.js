// node tests/assist-actions.e2e.js: when a student asks the AI to start a focus timer or add a task, it really happens. The AI
// does it (focusMinutes, newTasks); when a small on-device model only SAYS it did (Chrome's built-in AI often does), the app
// does it anyway from the request; and an answer never claims something was done that wasn't.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".wasm": "application/wasm"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
// Chrome's model, answering with whatever the test sets in window.__reply
function fake(){ window.LanguageModel = {availability: async () => "available", create: async () => ({contextWindow: 9000, contextUsage: 100, destroy(){}, prompt: async () => JSON.stringify(window.__reply)})}; }
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
  await ctx.addInitScript(([f]) => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; (0, eval)(`(${f})`)();
    localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]})); }, [fake.toString()]);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.SBASSIST && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(400);
  const ask = (q, reply) => p.evaluate(async ([q, r]) => { window.__reply = r; const x = await window.SBASSIST.ask(q); return {answer: x.answer, changes: (x.changes || []).map(c => ({kind: c.t.kind, title: c.t.task && c.t.task.title, due: c.t.task && c.t.task.due, time: c.t.task && c.t.task.time})), timer: x.timer || 0}; }, [q, reply]);
  const pomo = () => p.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo") || "{}"));
  const stop = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem("studioso:pomo") || "{}"); return s; });

  // 1. The model says it set the timer but sends no action (what the student saw): it starts anyway, for 5 minutes
  let r = await ask("start a 5 minute focus timer", {answer: "Sure, I can help you with that! Let's set a 5-minute focus timer. The app will start, and you can just focus on studying.", show: [], changes: [], newTasks: []});
  let pm = await pomo();
  ok(pm.running && pm.mode === "focus" && Math.round((pm.endAt - Date.now()) / 60000) === 5, "a 5-minute focus timer really starts: " + JSON.stringify({running: pm.running, mins: Math.round((pm.endAt - Date.now()) / 60000)}));
  ok(/5-minute focus timer is running/.test(r.answer), "and the answer says so truthfully: " + r.answer);
  // 2. The model does it properly with focusMinutes
  r = await ask("can you start a pomodoro for 15 minutes", {answer: "Starting it now!", show: [], changes: [], newTasks: [], focusMinutes: 15});
  pm = await pomo();
  ok(pm.running && Math.round((pm.endAt - Date.now()) / 60000) === 15, "the AI's own focusMinutes starts a 15-minute timer");
  // 3. "start a pomodoro" with no length: the student's usual focus length
  r = await ask("start a pomodoro", {answer: "Let's go!", show: [], changes: [], newTasks: []});
  pm = await pomo(); ok(pm.running && r.timer >= 1, "no length given: their usual focus length (" + r.timer + " min)");
  // 4. Asking about the timer doesn't start one
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("studioso:pomo")); s.running = false; localStorage.setItem("studioso:pomo", JSON.stringify(s)); });
  r = await ask("how long is a focus session?", {answer: "A focus session is 25 minutes by default.", show: [], changes: [], newTasks: []});
  ok(r.timer === 0 && /25 minutes/.test(r.answer), "a question about the timer just gets an answer: " + r.answer);

  // 5. A task with what it needs in the words is added by the app straight away (no model), and the answer says so, with undo
  const tasks = () => p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).tasks);
  const tmr = await p.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  r = await ask("add a task to email Dr. Lee tomorrow at 3pm", {answer: "I added the task to email Dr. Lee for tomorrow!", show: [], changes: [], newTasks: []});
  let lee = (await tasks()).find(t => t.title === "Email Dr. Lee");
  ok(lee && lee.due === tmr && lee.time === "15:00", "the task is really added, due tomorrow at 3 PM: " + JSON.stringify(lee && {due: lee.due, time: lee.time}));
  ok(/^Added Email Dr\. Lee\b/.test(r.answer) && /undo/.test(r.answer), "and the answer says what was added, with undo: " + r.answer);
  // 6. The course and type come from the words too
  r = await ask("add my bio lab report due Friday", {answer: "Here it is to check.", show: [], changes: [], newTasks: [{title: "Bio lab report", type: "Lab", due: "2026-12-04", course: "C1"}]});
  const lab = (await tasks()).find(t => t.title === "Bio lab report");
  ok(lab && lab.courseId === "c1" && lab.type === "Lab" && new Date(lab.due + "T12:00:00").getDay() === 5 && /^Added Bio lab report\b/.test(r.answer), "the lab report is added to Biology, due Friday: " + JSON.stringify(lab && {course: lab.courseId, type: lab.type, due: lab.due}));
  // 7. A claim with nothing behind it, for something the app can't do from the request
  r = await ask("move all my tasks to next week", {answer: "I've moved all your tasks to next week!", show: [], changes: [], newTasks: []});
  ok(!/moved all/i.test(r.answer) && /couldn't do that/.test(r.answer), "a change that wasn't made is never claimed: " + r.answer);
  // ("to next week" is where they go, not which ones: it used to pick the tasks due next week and move only those)
  lee = (await tasks()).find(t => t.title === "Email Dr. Lee");
  ok(lee.due === tmr && (await tasks()).find(t => t.title === "Bio lab report").due === lab.due, "and nothing was moved behind the student's back");
  // 8. Ordinary answers are left alone
  r = await ask("what should I study first?", {answer: "Let's start with your bio quiz: review the cards first.", show: [], changes: [], newTasks: []});
  ok(r.answer === "Let's start with your bio quiz: review the cards first." || /Today's Plan says/.test(r.answer), "advice that isn't a claim is untouched: " + r.answer);
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
