// Browser test, on a phone: everything Ask does works from the Companion tab (on phones there's no Ask in the speech bubble).
// Typed and tapped like a person would: find a note (the board zooms in and boxes it), find a task, change a task, add a
// task, change a setting, and answer a question. The AI is faked the same way as tests/assist.e2e.js.
// Run: node tests/assist-phone.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const OUT = process.env.SHOTS || require("os").tmpdir();
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const iso = d => d.toISOString().slice(0, 10);
const day = k => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() + k); return iso(d); };
// the next Tuesday at least 2 days away (a Biology lecture day)
const nextTue = (() => { for (let k = 2; k < 10; k++) { const d = new Date(); d.setHours(12); d.setDate(d.getDate() + k); if (d.getDay() === 2) return iso(d); } })();
const SEED = {v: 2, updated: 1, settings: {},
  courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#2f9e6a", meetings: [{id: "m1", kind: "Lecture", days: [2, 4], start: "10:00", end: "11:20", where: "Hall A"}]}, {id: "c2", name: "History", code: "HIS200", color: "#c0563b"}],
  tasks: [{id: "t1", title: "Essay draft", courseId: "c2", type: "Assignment", due: day(5), status: "todo", priority: "med"}, {id: "t2", title: "Lab report", courseId: "c1", type: "Lab", due: day(3), status: "todo", priority: "high"}],
  notes: [{id: "n1", text: "Mitochondria\nThe powerhouse of the cell, makes ATP", x: 120, y: 90, color: "yellow", board: ""},
    {id: "wb1", text: "Cell Biology board", wb: {v: 1, tpl: "blank"}, wbInk: [], wbItems: [{id: "i1", k: "t", x: 900, y: 700, s: "Cell parts", c: 0, f: 40}], created: Date.now() - 400000, updated: Date.now() - 400000}],
  decks: [{id: "d1", name: "Cells", courseId: "c1", cards: [{id: "k1", front: "What is ATP?", back: "The cell's energy currency"}],
    aiQuizzes: [{id: "z1", title: "Cell quiz", questions: [{id: "q1", type: "mcq", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria", "Ribosome"], correct: [0]}]}]}],
  files: [{id: "f1", name: "Lab report.pdf", courseId: "c1", folderId: "other", kind: "file", revs: []}], events: []};

// The fake AI. Reads the refs the app sent and answers like the real one would.
function reply(body){
  const sys = ((body.systemInstruction || {}).parts || []).map(p => p.text || "").join("\n");
  const text = (body.contents || []).flatMap(c => c.parts || []).map(p => p.text || "").join("\n");
  const refOf = re => { const line = text.split("\n").find(l => re.test(l)); const m = line && /^([A-Z]\d+) \|/.exec(line); return m ? m[1] : ""; };
  if (/You pick the control in a settings screen/.test(sys)) { const line = text.split("\n").find(l => /Daily Quote/.test(l)); return {i: line ? Number(line.split(" | ")[0]) : -1, value: "off"}; }
  if (/Describe a student's whiteboard/.test(sys)) return {about: "A labelled diagram of an animal cell", words: "Cell parts, nucleus, membrane", spots: [{what: "labelled cell diagram", x0: 0.1, y0: 0.1, x1: 0.6, y1: 0.7}]};
  const q = (/THE STUDENT ASKS: (.*)$/m.exec(text) || /STUDENT'S QUESTION: (.*)$/m.exec(text) || [])[1] || "";
  if (/always broken/.test(q)) return {answer: "string", followUps: [], show: [], changes: []};
  if (/lab report task/.test(q)) return {answer: "Here's your lab report.", show: [refOf(/^T\d+ \| Lab report/)], changes: []};
  if (/powerhouse note/.test(q)) return {answer: "Your Mitochondria note is on My Notes.", show: [refOf(/^N\d+ \|.*Mitochondria/)], changes: []};
  if (/cell diagram/.test(q)) return {answer: "It's on your Cell Biology board.", show: [refOf(/^W\d+ labelled cell diagram/) || (/W\d+ labelled cell diagram/.exec(text) || [""])[0].split(" ")[0]], changes: []};
  if (/essay to/.test(q)) return {answer: "Here's the change.", show: [], changes: [{ref: refOf(/^T\d+ \| Essay draft/), field: "due", value: "2031-03-14", scope: ""}, {ref: refOf(/^T\d+ \| Essay draft/), field: "priority", value: "high", scope: ""}]};
  if (/lecture to 3pm this/.test(q)) return {answer: "Moving that lecture.", show: [], changes: [{ref: refOf(new RegExp(`^K\\d+ \\| Tue \\| ${nextTue} \\|.*BIO101 Lecture`)), field: "from", value: "15:00", scope: "once"}]};
  if (/lectures to 9am/.test(q)) return {answer: "Moving your lectures.", show: [], changes: [{ref: refOf(/^K\d+ \|.*BIO101 Lecture/), field: "from", value: "09:00", scope: "all"}]};
  if (/rename the lab/.test(q)) return {answer: "Renaming it.", show: [], changes: [{ref: refOf(/^P\d+ \| Lab report\.pdf/), field: "name", value: "Lab 3 final", scope: ""}]};
  if (/fix the card/.test(q)) return {answer: "Updated.", show: [], changes: [{ref: refOf(/^F\d+ \|.*(What is ATP|ATP)/), field: "back", value: "Adenosine triphosphate, the energy currency", scope: ""}]};
  if (/quiz answer/.test(q)) return {answer: "Fixing it.", show: [], changes: [{ref: (/(Q\d+) \|[^\n]*Which organelle/.exec(text) || [])[1] || "", field: "correct", value: "Mitochondria", scope: ""}]};
  if (/daily quote/.test(q)) return {answer: "Turning it off.", show: [], changes: [{ref: "SETTINGS", field: "setting", setting: "daily quote", value: "off", scope: ""}]};
  if (/made up/.test(q)) return {answer: "Done!", show: ["T99"], changes: [{ref: "T99", field: "due", value: "2030-01-01"}, {ref: refOf(/^T\d+ \| Lab report/), field: "due", value: "not a date"}]};
  if (/add a bio quiz/.test(q)) return {answer: "Adding it.", show: [], changes: [], newTasks: [{title: "Cell quiz", course: refOf(/^C\d+ \| Biology/), type: "Quiz", due: "2031-04-02", time: "9:30", priority: "", hours: 2, notes: "Chapters 3 and 4"}]};
  if (/add my readings/.test(q)) return {answer: "Adding both.", show: [], changes: [], newTasks: [{title: "Read chapter 5", course: "", type: "Reading", due: "2031-04-03", time: "", priority: "low", hours: 0, notes: ""}, {title: "Read chapter 6", course: "C99", type: "Reading", due: "not a date", time: "25:00", priority: "low", hours: 0, notes: ""}, {title: "", type: "Reading", due: "2031-04-04"}]};
  if (/third time/.test(q)) return body.generationConfig && body.generationConfig.responseSchema ? {answer: "string", followUps: []} : {answer: "Third time lucky: here's the real answer."};
  if (/how many courses/.test(q)) { reply.hm = (reply.hm || 0) + 1; return reply.hm === 1 ? {answer: "string", sources: ["Courses"], followUps: ["Which courses have marks entered?"], show: [], changes: []} : {answer: "You have 2 courses: BIO101 and HIS200.", followUps: []}; }
  if (/retry me/.test(q)) { reply.tries = (reply.tries || 0) + 1; return reply.tries === 1 ? {answer: "", show: [], changes: []} : {answer: "Second try worked.", show: [], changes: []}; }
  if (/long answer/.test(q)) return {answer: "Osmosis explained. " + "Water moves across a membrane toward the side with more solute. ".repeat(70) + "THE END.", show: [], changes: []};
  if (/what deck/.test(q)) return {answer: "You're looking at Cells.", show: [], changes: []};
  return {answer: "Okay.", show: [], changes: []};
}

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: "block"}); const sent = [];
  await ctx.route(/generativelanguage\.googleapis\.com/, route => {
    let body = {}; try { body = JSON.parse(route.request().postData() || "{}"); } catch (e) {}
    sent.push(body);
    if (/(STUDENT'S QUESTION|THE STUDENT ASKS): server down/.test(((body.contents || []).flatMap(c => c.parts || []).map(p => p.text || "").join("\n")))) { route.fulfill({status: 500, contentType: "application/json", body: JSON.stringify({error: {code: 500, message: "Internal error", status: "INTERNAL"}})}); return; }
    route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply(body))}]}, finishReason: "STOP"}]})});
  });
  await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
    localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
  } } catch (e) {} }, SEED);
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await page.goto(base); await page.waitForFunction(() => window.SBASSIST && window.__sbSync && window.SBCOMPTAB); await page.waitForTimeout(800);
  const ask = q => page.evaluate(async q => { const r = await SBASSIST.ask(q); window.__res = r; return {answer: r.answer, show: r.show.map(t => t.kind + ":" + (t.id || "")), changes: r.changes.map(c => [c.t.kind, c.field, c.from, c.to])}; }, q);
  const actNow = () => page.evaluate(() => { window.__done = false; SBASSIST.act(window.__res).then(() => { window.__done = true; }); });
  const confirmShown = async () => { await page.waitForSelector("#asDlg[open]", {timeout: 8000}); return page.$eval("#asDlg", d => d.innerText); };
  const lastBody = () => { const b = sent[sent.length - 1] || {}; return (b.contents || []).flatMap(c => c.parts || []).map(p => p.text || "").join("\n"); };
  const S = fn => page.evaluate(`(() => { const A = window.__sbApp, state = A.state, ui = A.ui, render = A.render, dlg = A.dlg, undoLast = A.undoLast; return (${fn})(); })()`);

  // The Companion tab, opened from the tab bar
  const openTab = async () => { await page.tap('nav.tabs [data-tab="companion"]'); await page.waitForSelector("#cptIn", {state: "visible", timeout: 8000}); await page.waitForTimeout(300); };
  const askTab = async q => {
    const n0 = page.locator(".cpt-a").count ? await page.locator(".cpt-a:not(.cpt-wait)").count() : 0;
    await page.tap("#cptIn"); await page.fill("#cptIn", q); await page.tap("#cptGo");
    await page.waitForFunction(n0 => document.querySelectorAll(".cpt-a:not(.cpt-wait)").length > n0, n0, {timeout: 15000}); await page.waitForTimeout(400);
  };
  ok(await page.evaluate(() => !document.querySelector(".cp-ask, [data-act='cp-ask']") || !document.querySelector(".cp-ask").offsetParent), "on a phone, the speech bubble has no Ask box showing");

  // 1. Find a note: the board zooms in on it and draws a box
  await openTab(); await askTab("where's my powerhouse note");
  const showBtn = page.locator(".cpt-show-b").last(); await showBtn.waitFor({timeout: 8000});
  ok(/Mitochondria/.test(await showBtn.innerText()), "Ask in the Companion tab finds the note by what it says");
  await showBtn.tap(); await page.waitForTimeout(1200);
  const nr = await page.evaluate(() => { const sc = document.getElementById("nbScroll"), n = document.querySelector('.note[data-note="n1"]'); if (!sc || !n) return null; const a = sc.getBoundingClientRect(), c = n.getBoundingClientRect(); return {box: n.classList.contains("nb-found"), inView: c.left >= a.left - 2 && c.right <= a.right + 2 && c.top >= a.top - 2 && c.bottom <= a.bottom + 2, w: Math.round(c.width), zoom: document.querySelector(".nb-zoom") ? document.querySelector(".nb-zoom").innerText.replace(/\s+/g, " ") : ""}; });
  ok(await S(() => ui.tab) === "notes" && nr && nr.box && nr.inView, "one tap opens Notes, the note is in view with a highlight box: " + JSON.stringify(nr));
  await page.screenshot({path: path.join(OUT, "phone-note.png")});

  // 2. Find a task
  await openTab(); await askTab("show me the lab report task");
  const tBtn = page.locator(".cpt-show-b").last(); await tBtn.waitFor({timeout: 8000}); await tBtn.tap(); await page.waitForTimeout(900);
  ok(await S(() => ui.tab) === "board" || await page.evaluate(() => !!document.querySelector("#dlg[open]")), "a found task opens on a phone");
  await S(() => { if (dlg.open) dlg.close(); });

  // 3. Change a task, confirmed first
  await openTab(); await askTab("move my essay to march 14 and make it high priority");
  const ch = page.locator('[data-act="cpt-change"]').last(); await ch.waitFor({timeout: 8000}); await ch.tap();
  await confirmShown(); await page.tap("#asYes"); await page.waitForTimeout(500);
  ok(await S(() => state.tasks.t1.due) === "2031-03-14" && await S(() => state.tasks.t1.priority) === "high", "changing a task from the Companion tab works on a phone, after confirming");

  // 4. Add a task
  await openTab(); await askTab("add a bio quiz on april 2 at 9:30");
  const add = page.locator(".cpt-action", {hasText: "Cell quiz"}).locator('[data-act="cpt-change"]'); await add.waitFor({timeout: 8000}); await add.tap();
  await confirmShown(); await page.tap("#asYes"); await page.waitForTimeout(500);
  ok(await S(() => Object.values(state.tasks).some(t => t.title === "Cell quiz" && t.courseId === "c1" && t.due === "2031-04-02")), "adding a task from the Companion tab works on a phone");

  // 5. Change a setting: Settings opens with the control, confirmed there
  const quoteOn = () => S(() => { const el = [...dlg.querySelectorAll('input[type="checkbox"]')].find(i => { let p = i; for (let k = 0; k < 5; k++) { p = p.parentElement; if (p && /Daily Quote/.test(p.innerText) && p.innerText.length < 300) return true; } return false; }); return el ? el.checked : null; });
  await openTab(); await askTab("turn off the daily quote");
  const sc5 = page.locator('[data-act="cpt-change"]').last(); await sc5.waitFor({timeout: 8000}); await sc5.tap();
  const box5 = await confirmShown(); const q0 = await quoteOn();
  await page.tap("#asYes"); await page.waitForTimeout(700); const q1 = await quoteOn();
  ok(/Daily Quote/i.test(box5) && q0 === true && q1 === false, "changing a setting from the Companion tab works on a phone: " + JSON.stringify([q0, q1]));
  await S(() => { if (dlg.open) dlg.close(); });

  // 6. A plain question gets an answer
  await openTab(); await askTab("how many courses do I have");
  const last = await page.locator(".cpt-a:not(.cpt-wait)").last().innerText();
  ok(/2 courses|BIO101/.test(last), "questions get answered in the Companion tab on a phone: " + JSON.stringify(last.slice(0, 80)));

  // Whatever is found gets the highlight box: a flashcard (its whole tile) and a task
  await S(() => { if (dlg.open) dlg.close(); });
  await page.evaluate(() => SBASSIST.jump({kind: "card", deck: "d1", id: "k1"})); await page.waitForTimeout(700);
  const fbox = await page.evaluate(() => { const f = document.querySelector(".sb-found"); return f ? f.className + "|" + !!f.querySelector('[data-id="k1"]') : ""; });
  ok(/fc-row/.test(fbox) && /\|true$/.test(fbox), "a found flashcard gets the highlight box around its whole tile on a phone: " + fbox);
  await page.evaluate(() => SBASSIST.jump({kind: "task", id: "t2"})); await page.waitForTimeout(700);
  const tbox = await page.evaluate(() => { const f = document.querySelector(".sb-found"); return f ? (f.dataset.id || "") + "|" + getComputedStyle(f).outlineStyle : ""; });
  ok(/^t2\|solid/.test(tbox) || await page.evaluate(() => !!document.querySelector("#dlg[open]")), "a found task gets the highlight box too on a phone: " + tbox);
  await S(() => { if (dlg.open) dlg.close(); });
  ok(!errs.length, "no page errors " + errs.join(" | "));
  console.log("\nassist-phone.e2e: " + n + " checks passed");
  await browser.close(); server.close();
})().catch(e => { console.error("FAIL:", e); process.exit(1); });
