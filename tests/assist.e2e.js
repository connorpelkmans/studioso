// Browser test: Ask finds anything and jumps to it, knows the page you're on, and makes changes only after you confirm
// (98-assist.js, the companion bubble and the Companion tab). The AI is faked: it answers by looking up refs in the list the
// app sends, so the list, the jumps and the changes are the app's own.
// Run: node tests/assist.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
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
  if (/what deck/.test(q)) return {answer: "You're looking at Cells.", show: [], changes: []};
  return {answer: "Okay.", show: [], changes: []};
}

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"}); const sent = [];
  await ctx.route(/generativelanguage\.googleapis\.com/, route => {
    let body = {}; try { body = JSON.parse(route.request().postData() || "{}"); } catch (e) {}
    sent.push(body);
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

  // Finding: a note by what it says
  let r = await ask("where's my powerhouse note");
  ok(r.show[0] === "note:n1", "a note is found by what it says: " + JSON.stringify(r.show));
  await actNow(); await page.waitForTimeout(500);
  ok(await S(() => ui.tab) === "notes" && await S(() => !!document.querySelector('.note[data-note="n1"].sx-flash')), "and Ask jumps to it on the Notes page and highlights it");

  // Whiteboards are described in the background, and a picture on one can be found and shown
  const described = await S(() => SBASSIST.describeBoards(3));
  ok(described === 1 && sent.some(b => JSON.stringify(b).includes("inline_data")), "a whiteboard is described from a picture of it (in the background)");
  r = await ask("which whiteboard has the cell diagram");
  ok(/W\d+ labelled cell diagram/.test(lastBody()), "the board's description and its spots go into what Ask can find");
  ok(r.show[0] === "board:wb1", "the whiteboard with the diagram is found: " + JSON.stringify(r.show));
  ok(await page.evaluate(() => !!(window.__res.show[0] && window.__res.show[0].spot && window.__res.show[0].spot.what === "labelled cell diagram")), "the spot on the board is found, not just the board");
  ok(/^(W\d+) \| Cell Biology board/m.test(lastBody()) && !/^W1 \| .*\n.*W1 labelled/m.test(lastBody()) && /W(\d+) labelled cell diagram/.exec(lastBody())[1] !== /^W(\d+) \| Cell Biology board/m.exec(lastBody())[1], "a board and each spot on it have their own refs");
  await actNow(); await page.waitForTimeout(1500);
  ok(await S(() => ui.tab === "notes" && SBWB.curId() === "wb1"), "and Ask opens that whiteboard");
  const cam = await S(() => SBWB.cam ? SBWB.cam() : null);
  ok(!cam || cam.z <= 1.5, "and moves to the spot on it");

  // Knowing the page: on a deck, Ask is told what's on screen
  await S(() => { ui.tab = "flashcards"; ui.deckId = "d1"; ui.fc = null; render(); });
  await page.waitForTimeout(300);
  await ask("what deck is this");
  ok(/IS LOOKING AT RIGHT NOW: the Review \(flashcards and quizzes\) page \(deck "Cells"/.test(lastBody()) && /What is ATP/.test(lastBody()), "Ask knows the page the student is on, and what it shows");

  // Changing: a task's due date and priority, shown and confirmed first
  r = await ask("move my essay to march 14 and make it high priority");
  ok(r.changes.length === 2 && r.changes[0][1] === "due" && r.changes[0][3] === new Date(2031, 2, 14).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"}), "the change is checked and described: " + JSON.stringify(r.changes));
  await actNow(); let box = await confirmShown();
  ok(/Essay draft/.test(box) && /Due date/i.test(box) && /Priority/i.test(box) && /Medium/.test(box) && /High/.test(box), "a confirm panel lists each change, before and after");
  ok(await S(() => state.tasks.t1.due) !== "2031-03-14", "nothing changes before Apply");
  await page.click("#asYes"); await page.waitForFunction(() => window.__done);
  ok(await S(() => state.tasks.t1.due === "2031-03-14" && state.tasks.t1.priority === "high"), "Apply makes both changes");
  ok(await page.locator(".toast", {hasText: "Made 2 changes"}).count() > 0, "with one Undo for both");
  await S(() => { if (dlg.open) dlg.close(); undoLast(); }); await page.waitForTimeout(200);
  ok(await S(() => state.tasks.t1.due !== "2031-03-14" && state.tasks.t1.priority === "med"), "Undo puts both back");

  // Cancel changes nothing
  r = await ask("move my essay to march 14 and make it high priority"); await actNow(); await confirmShown();
  await page.click("#asNo"); await page.waitForFunction(() => window.__done);
  ok(await S(() => state.tasks.t1.due !== "2031-03-14"), "Cancel changes nothing");

  // One class on one day, then every week
  r = await ask("move tuesday's lecture to 3pm this week");
  ok(r.changes[0] && r.changes[0][0] === "class", "a class on one day can be changed: " + JSON.stringify(r.changes));
  await actNow(); box = await confirmShown();
  ok(await S(() => ui.tab) === "schedule" && /3:00|15:00/.test(box), "Ask goes to that week's schedule and shows the new time");
  await page.click("#asYes"); await page.waitForFunction(() => window.__done);
  const mv = await S(() => state.courses.c1.meetMoves); const k = Object.keys(mv || {})[0];
  ok(k && k.startsWith(nextTue) && mv[k].start === "15:00" && mv[k].end === "16:20", `only that day moves, keeping its length: ${JSON.stringify(mv)}`);
  ok(await S(() => state.courses.c1.meetings[0].start) === "10:00", "the weekly time stays");
  r = await ask("move all my biology lectures to 9am"); await actNow(); await confirmShown(); await page.click("#asYes"); await page.waitForFunction(() => window.__done);
  ok(await S(() => state.courses.c1.meetings[0].start === "09:00" && state.courses.c1.meetings[0].end === "10:20"), "every week: the weekly class time changes, keeping its length");

  // A file rename keeps its extension
  r = await ask("rename the lab report file to Lab 3 final");
  ok(r.changes[0] && r.changes[0][3] === "Lab 3 final.pdf", "a rename keeps the file's extension: " + JSON.stringify(r.changes));
  await actNow(); await confirmShown();
  ok(await S(() => ui.tab) === "files", "Ask goes to Files to show it");
  await page.click("#asYes"); await page.waitForFunction(() => window.__done);
  ok(await S(() => state.files.f1.name) === "Lab 3 final.pdf", "and renames it");

  // A card and a quiz question
  r = await ask("fix the card about ATP"); await actNow(); await confirmShown(); await page.click("#asYes"); await page.waitForFunction(() => window.__done);
  ok(await S(() => state.decks.d1.cards[0].back) === "Adenosine triphosphate, the energy currency", "a flashcard is changed");
  r = await ask("the quiz answer for the ATP question is wrong");
  ok(r.changes[0] && r.changes[0][1] === "correct" && r.changes[0][2] === "Nucleus" && r.changes[0][3] === "Mitochondria", "a quiz question's answer change is checked against its choices: " + JSON.stringify(r.changes));
  await actNow(); await confirmShown(); await page.click("#asYes"); await page.waitForFunction(() => window.__done);
  ok(await S(() => JSON.stringify(state.decks.d1.aiQuizzes[0].questions[0].correct)) === "[1]", "and the quiz is fixed");

  // New tasks: checked, shown, and only added on Add
  const before0 = await S(() => Object.keys(state.tasks).length);
  r = await ask("add a bio quiz on april 2 at 9:30");
  ok(r.changes.length === 1 && r.changes[0][0] === "newtask" && /Quiz · BIO101 · due .*Apr 2.*9:30/.test(r.changes[0][3]), "a new task is checked and described: " + JSON.stringify(r.changes));
  await actNow(); box = await confirmShown();
  ok(/Add this task\?/.test(box) && /Cell quiz/.test(box), "it's shown for the student to confirm");
  ok(await S(() => Object.keys(state.tasks).length) === before0, "nothing is added before Add");
  await page.click("#asYes"); await page.waitForFunction(() => window.__done);
  const made = await S(() => Object.values(state.tasks).find(t => t.title === "Cell quiz"));
  ok(made && made.courseId === "c1" && made.type === "Quiz" && made.due === "2031-04-02" && made.time === "09:30" && made.priority === "med" && made.hours === 2 && /Chapters 3/.test(made.notes) && made.status === "todo", "Add makes the task with its course, date, time, type and details: " + JSON.stringify(made && {c: made.courseId, due: made.due, time: made.time, p: made.priority}));
  ok(await page.locator(".toast", {hasText: 'Added "Cell quiz"'}).count() > 0, "with Undo");
  await S(() => { if (dlg.open) dlg.close(); undoLast(); }); await page.waitForTimeout(200);
  ok(await S(() => !Object.values(state.tasks).some(t => t.title === "Cell quiz")), "and Undo takes it away again");
  r = await ask("add my readings for chapters 5 and 6");
  ok(r.changes.length === 2 && /no due date/.test(r.changes[1][3]) && !/BIO|HIS/.test(r.changes[1][3]), "several at once; a bad date, time or course is dropped, and a task with no title is skipped: " + JSON.stringify(r.changes));
  await actNow(); box = await confirmShown(); ok(/Add these 2 tasks\?/.test(box), "several are confirmed together");
  await page.click("#asNo"); await page.waitForFunction(() => window.__done);
  ok(await S(() => !Object.values(state.tasks).some(t => /Read chapter/.test(t.title))), "Cancel adds nothing");

  // Made-up refs and bad values are dropped
  r = await ask("this is made up");
  ok(!r.show.length && !r.changes.length, "refs that don't exist and values that aren't valid are dropped");

  // A setting, through the Settings sheet's own control
  await S(() => { ui.tab = "board"; render(); });
  r = await ask("turn off the daily quote");
  await actNow(); box = await confirmShown();
  ok(/Daily Quote/i.test(box) && /off/i.test(box) && await S(() => dlg.open), "settings are found in the Settings sheet and confirmed there");
  const before = await S(() => { const el = [...dlg.querySelectorAll('input[type="checkbox"]')].find(i => { let p = i; for (let k = 0; k < 5; k++) { p = p.parentElement; if (p && /Daily Quote/.test(p.innerText) && p.innerText.length < 300) return true; } return false; }); return el && el.checked; });
  await page.click("#asYes"); await page.waitForFunction(() => window.__done); await page.waitForTimeout(200);
  const after = await S(() => { const el = [...dlg.querySelectorAll('input[type="checkbox"]')].find(i => { let p = i; for (let k = 0; k < 5; k++) { p = p.parentElement; if (p && /Daily Quote/.test(p.innerText) && p.innerText.length < 300) return true; } return false; }); return el && el.checked; });
  ok(before === true && after === false, "and changed with it");
  await S(() => { if (dlg.open) dlg.close(); });

  // The Companion tab: knows the page you came from, shows what it finds
  await S(() => { ui.tab = "flashcards"; ui.deckId = "d1"; render(); }); await page.waitForTimeout(900);
  await S(() => SBCOMPTAB.open("where's my powerhouse note"));
  await page.waitForSelector(".cpt-show-b", {timeout: 15000});
  ok(/WAS JUST LOOKING AT \(before opening the Companion tab\): the Review/.test(lastBody()), "the Companion tab knows the page the student came from");
  await page.click(".cpt-show-b"); await page.waitForTimeout(600);
  ok(await S(() => ui.tab) === "notes", "a found thing in the Companion tab opens with one tap");
  await S(() => SBCOMPTAB.open("move my essay to march 14 and make it high priority"));
  await page.waitForSelector('[data-act="cpt-change"]', {timeout: 15000});
  await page.click('[data-act="cpt-change"]'); await confirmShown(); await page.click("#asYes"); await page.waitForTimeout(500);
  ok(await S(() => state.tasks.t1.due) === "2031-03-14", "changes from the Companion tab are confirmed the same way");
  await S(() => SBCOMPTAB.open("add a bio quiz on april 2 at 9:30"));
  const addBtn = page.locator(".cpt-action", {hasText: "Cell quiz"}).locator('[data-act="cpt-change"]');
  await addBtn.waitFor({timeout: 15000}); await addBtn.click(); await confirmShown(); await page.click("#asYes"); await page.waitForTimeout(500);
  ok(await S(() => Object.values(state.tasks).some(t => t.title === "Cell quiz" && t.courseId === "c1")), "the Companion tab adds tasks the same way");

  // The bubble on a computer: tap the companion, Ask, and it goes there
  await S(() => { ui.tab = "board"; render(); }); await page.waitForTimeout(400);
  if (await page.evaluate(() => window.SBCOMP && SBCOMP.askAvailable && SBCOMP.askAvailable())) {
    await page.waitForTimeout(8500);   // Ask keeps 8 seconds between questions
    await page.evaluate(() => SBCOMP.askOpen()); await page.waitForSelector(".cp-ask-in", {timeout: 8000});
    ok(/find or change anything/.test(await page.getAttribute(".cp-ask-in", "placeholder")), "the bubble's Ask says it can find or change anything");
    await page.fill(".cp-ask-in", "where's my powerhouse note"); await page.press(".cp-ask-in", "Enter");
    await page.waitForFunction(() => window.__sbApp.ui.tab === "notes", null, {timeout: 15000});
    const said = await page.waitForFunction(() => /Mitochondria note/.test((document.querySelector(".cp-bubble") || {}).innerText || ""), null, {timeout: 8000}).then(() => true, () => false);
    ok(said, "the bubble answers, and the app jumps to what it found");
  } else ok(false, "the companion's Ask should be available with a Gemini key");

  ok(!errs.length, "no errors: " + errs.join("; "));
  await browser.close(); server.close();
  console.log(`assist.e2e: ${n} checks passed`);
})().catch(e => { console.error("FAIL:", e && e.stack || e); process.exit(1); });
