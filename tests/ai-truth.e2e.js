// node tests/ai-truth.e2e.js: the on-device AI's Ask doesn't make things up and handles several things at once (src/js/98-truth.js,
// 98-assist.js, 01-ai-device.js). Chrome's model and Wikipedia are stood in for.
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
// Chrome's model answers with window.__replies (in order, the last repeats) and logs what it was asked
function fake(){
  window.__asked = []; window.__replies = [];
  window.LanguageModel = {availability: async () => "available", create: async c => { const sys = ((c && c.initialPrompts) || [])[0] ? c.initialPrompts[0].content : "";
    const s = {contextWindow: 9000, contextUsage: 100, destroy(){}, clone: async () => s,
      prompt: async (input) => { const text = input.map(m => m.content.map(x => x.value).join("\n")).join("\n"); window.__asked.push({sys, text}); const r = window.__replies.length > 1 ? window.__replies.shift() : window.__replies[0]; if (r && r.__wiki) return JSON.stringify({answer: /Wikipedia: Osmosis/.test(text) ? "According to Wikipedia, osmosis is the net movement of water through a selectively permeable membrane." : "No source.", show: [], changes: [], newTasks: []}); return JSON.stringify(r); }};
    return s; }};
}
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const ctx = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"}), wiki = [];
  await ctx.route(/en\.wikipedia\.org\/w\/api\.php/, r => { const u = new URL(r.request().url()); wiki.push(u.searchParams.get("srsearch") || u.searchParams.get("titles"));
    const body = u.searchParams.get("list") === "search" ? {query: {search: [{title: "Osmosis"}]}} : {query: {pages: [{title: "Osmosis", extract: "Osmosis is the spontaneous net movement of water molecules through a selectively permeable membrane from a region of high water potential to a region of low water potential. It was described by Jean-Antoine Nollet in 1748."}]}};
    r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(body)}); });
  await ctx.addInitScript(([f, T]) => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__SB_WEB_TEST = true; (0, eval)(`(${f})`)();
    localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
    const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}],
      tasks: [{id: "t1", title: "Bio Lab Report", due: d(1), status: "todo", type: "Lab", courseId: "c1"}, {id: "t2", title: "History Essay", due: d(4), status: "todo", type: "Assignment"}, {id: "t3", title: "Chem Problem Set", due: d(-2), status: "todo", type: "Assignment"}]})); }, [fake.toString()]);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.SBASSIST && window.SBTRUTH && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(500);
  const ask = (q, replies) => p.evaluate(async ([q, r]) => { window.__replies = r; window.__asked = []; const x = await window.SBASSIST.ask(q); return {answer: x.answer, changes: (x.changes || []).map(c => c.t.kind + ":" + (c.t.task ? c.t.task.title : c.field)), timer: x.timer || 0, asked: window.__asked.length, sources: x.sources || null, prompts: window.__asked.map(a => a.text)}; }, [q, replies]);
  const NONE = [{answer: "should not be used", show: [], changes: [], newTasks: []}];

  // 1. planner facts come from the app, exactly, and the model isn't asked
  let r = await ask("what's due tomorrow?", NONE);
  ok(/1 task due tomorrow/.test(r.answer) && /Bio Lab Report/.test(r.answer) && r.asked === 0, "what's due tomorrow: from the app, exact, no model: " + r.answer.replace(/\n/g, " "));
  r = await ask("anything overdue?", NONE);
  ok(/Chem Problem Set/.test(r.answer) && /overdue/.test(r.answer) && r.asked === 0, "what's overdue: " + r.answer.replace(/\n/g, " "));
  r = await ask("when is my history essay due?", NONE);
  ok(/History Essay/.test(r.answer) && r.asked === 0, "when one task is due: " + r.answer);
  // 2. a made-up specific is caught: asked again strictly, then replaced if it's still made up
  r = await ask("who teaches my bio class?", [{answer: "Dr. Patel teaches it in Room 210.", show: [], changes: [], newTasks: []}, {answer: "Professor Nguyen in Hall 9.", show: [], changes: [], newTasks: []}]);
  ok(r.asked === 2 && /couldn't find that in your Studyboard/.test(r.answer), "an answer with names and numbers that aren't anywhere is retried, then replaced: " + r.answer);
  r = await ask("who teaches my bio class?", [{answer: "Dr. Patel teaches it in Room 210.", show: [], changes: [], newTasks: []}, {answer: "Your Biology course doesn't list an instructor yet.", show: [], changes: [], newTasks: []}]);
  ok(r.asked === 2 && /doesn't list an instructor/.test(r.answer), "and a corrected answer is kept: " + r.answer);
  // 3. several things at once
  r = await ask("add bio quiz on friday and then start a 15 minute focus timer", [{answer: "Here it is to check.", show: [], changes: [], newTasks: [{title: "Bio quiz", type: "Quiz", due: "2030-01-04"}]}, {answer: "Starting!", show: [], changes: [], newTasks: [], focusMinutes: 15}]);
  ok(r.changes.some(c => /newtask:Bio quiz/i.test(c)) && r.timer === 15, "two things in one request: the task is proposed and the timer runs: " + JSON.stringify({changes: r.changes, timer: r.timer}));
  // 4. a general question: Wikipedia is looked up and given as a source; the answer says where it's from
  r = await ask("what is osmosis?", [{__wiki: true}]);
  ok(wiki.length >= 2 && r.prompts.some(t => /FROM THE WEB \(Wikipedia/.test(t)), "a general question looks up Wikipedia and gives it to the model: " + wiki.join(", "));
  ok(/According to Wikipedia/.test(r.answer) && r.sources && r.sources[0].url === "https://en.wikipedia.org/wiki/Osmosis", "the answer comes from it, with the link: " + r.answer);
  // 5. an on-device request that wants the web: the model writes a query, Wikipedia is searched, the result is a source
  const w = await p.evaluate(async () => { window.__asked = []; window.__replies = [{query: "osmosis definition"}, {answer: "ok"}]; const x = await window.__sbDevAI.call({system: "Answer the question.", parts: [{text: "What is osmosis?"}], schema: {type: "OBJECT", properties: {answer: {type: "STRING"}}}, search: true}); return {data: x.data, prompts: window.__asked.map(a => a.text)}; });
  ok(w.prompts.length === 2 && /WEB SOURCES/.test(w.prompts[1]) && /Osmosis is the spontaneous/.test(w.prompts[1]), "a web request on the device: a query first, then the answer from what Wikipedia found");
  // 6. the Companion tab's chat: the same rules
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  const chat = async (q, replies) => { await p.evaluate(r => { window.__replies = r; window.__asked = []; }, replies); await p.fill("#cptIn", q); await p.click("#cptGo");
    await p.waitForFunction(n => document.querySelectorAll(".cpt-msg .cpt-a, .cpt-a").length >= n, (await p.evaluate(() => document.querySelectorAll(".cpt-msg .cpt-a, .cpt-a").length)) + 1, {timeout: 20000}).catch(() => {});
    await p.waitForTimeout(300); return p.evaluate(() => ({last: [...document.querySelectorAll(".cpt-a")].pop() ? [...document.querySelectorAll(".cpt-a")].pop().innerText : "", asked: window.__asked.map(a => ({sys: a.sys.slice(0, 80), text: a.text}))})); };
  let c = await chat("what's due tomorrow?", NONE);
  ok(/Bio Lab Report/.test(c.last) && c.asked.length === 0, "Companion tab: what's due, from the app, no model: " + c.last.replace(/\n/g, " ").slice(0, 120));
  c = await chat("explain osmosis", [{points: ["What osmosis is", "Which way water moves", "An example in cells"]}, {__wiki: true}]);
  ok(c.asked.some(a => /plan a clear, complete answer/.test(a.sys)) && c.asked.some(a => /ANSWER PLAN/.test(a.text) && /Which way water moves/.test(a.text) && /Wikipedia: Osmosis/.test(a.text)), "a general question: Wikipedia, then the key points to cover, then the answer");
  c = await chat("who wrote my bio syllabus?", [{answer: "Professor Hensley wrote it in 2019.", followUps: [], sources: []}, {answer: "Professor Hensley wrote it in 2019.", followUps: [], sources: []}]);
  ok(/couldn't find a reliable answer/.test(c.last), "Companion tab: a made-up name and year are caught: " + c.last.slice(0, 120));
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(`\nai-truth.e2e: ${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
