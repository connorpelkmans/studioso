// node tests/import-apps.e2e.js
"use strict";
const http = require("http"), fs = require("fs"), os = require("os"), path = require("path"), zlib = require("zlib"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {ankiCollection, local} = require("./anki-fixture");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const served = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  served.push(p);
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// A small zip writer (stored or deflated entries)
function zip(entries){
  const parts = [], dir = []; let off = 0;
  for (const [name, data0, deflate] of entries) {
    const data = Buffer.from(data0), nm = Buffer.from(name), body = deflate ? zlib.deflateRawSync(data) : data, crc = zlib.crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x800, 6); h.writeUInt16LE(deflate ? 8 : 0, 8);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nm.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x800, 8); c.writeUInt16LE(deflate ? 8 : 0, 10);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nm.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, nm, body); dir.push(c, nm); off += 30 + nm.length + body.length;
  }
  const cd = Buffer.concat(dir), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(entries.length, 8); e.writeUInt16LE(entries.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, e]);
}

(async () => {
  const c11 = ankiCollection("11"), c18 = ankiCollection("18"), dummy = ankiCollection("dummy");
  if (!c11) { console.log("python3 with sqlite3 not found: skipped"); return; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sb-import-"));
  const html = require("../scripts/app-files").source();
  const IA = new Function(html.slice(html.indexOf("/*IMPORTAPPS-START*/"), html.indexOf("/*IMPORTAPPS-END*/")) + ";return IA;")();
  const files = {
    apkg: path.join(tmp, "Biology.apkg"), apkg21b: path.join(tmp, "Newer Anki.apkg"), todoist: path.join(tmp, "BIO 101.csv"), notion: path.join(tmp, "Export-1234.zip"),
  };
  fs.writeFileSync(files.apkg, zip([["collection.anki2", dummy], ["collection.anki21", c11, true], ["media", '{"0": "a.jpg"}', true], ["0", Buffer.alloc(300, 1)]]));
  fs.writeFileSync(files.apkg21b, zip([["meta", Buffer.from([8, 3])], ["collection.anki2", dummy, true], ["collection.anki21b", Buffer.from(IA.zstdRaw(new Uint8Array(c18)))], ["media", Buffer.from(IA.zstdRaw(new Uint8Array(0)))]]));
  fs.writeFileSync(files.todoist, [
    "TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE,DURATION,DURATION_UNIT,DEADLINE,DEADLINE_LANG",
    "section,Labs,,1,1,,,,,,,,,", "task,Lab 3 write-up,Use the template,4,1,Me,,Oct 30 2026,en,,,,,", "task,Graph the data,,1,2,Me,,,,,,,,",
    "task,Pre-lab quiz,,2,1,Me,,every friday,en,,,,,", "",
  ].join("\r\n"));
  const inner = zip([
    ["Export/Course Notes 0123456789abcdef0123456789abcdef.md", "# Course Notes\n\n## Week 1\n\n- **Cells** are the unit of life\n- [ ] Read chapter 1\n\n![x](Course%20Notes/x.png)", true],
    ["Export/Homework 11111111111111111111111111111111_all.csv", "Name,Due,Status\nEssay draft,\"October 28, 2026\",Not started\nOld one,\"October 1, 2026\",Done", true],
    ["Export/Homework/Essay draft 22222222222222222222222222222222.md", "# Essay draft\n\nDue: October 28, 2026"],
    ["Export/Vocab 33333333333333333333333333333333.csv", "Term,Definition\nOsmosis,Water crossing a membrane\nDiffusion,Spreading from high to low", true],
  ]);
  fs.writeFileSync(files.notion, zip([["Export-1234-Part-1.zip", inner]]));

  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1200, height: 900}}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "bio", name: "Biology", code: "BIO 101", color: "#3B6FE0"}], tasks: [], settings: {}}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBIMPORT && document.querySelector('[data-act="menu"]'), null, {timeout: 40000}); await page.waitForTimeout(400);
    const S = () => page.evaluate(() => { const s = SBIMPORT.state(); return {decks: Object.values(s.decks), tasks: Object.values(s.tasks), notes: Object.values(s.notes)}; });
    const toastTxt = () => page.evaluate(() => { const t = document.querySelector("#toast"); return t && t.classList.contains("show") ? t.textContent.replace(/\s+/g, " ").trim() : ""; });
    const clickAct = act => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, act);
    const pick = async f => { await page.setInputFiles("#iaFile", f); await page.waitForSelector("#iaSum", {timeout: 20000}); return (await page.textContent("#iaSum")).trim(); };

    // entry points
    await page.locator('[data-act="menu"]:visible').first().click(); await page.waitForSelector(".us-cat"); await page.click('.us-cat[data-us="data"]');
    await page.evaluate(() => { const t = [...document.querySelectorAll(".us-pane.on .us-sub-tab")].find(x => /Export/.test(x.textContent)); if (t) t.click(); });
    await page.waitForSelector('dialog[open] [data-act="ia-open"]');
    ok(await page.evaluate(() => { const b = document.querySelector('dialog[open] [data-act="ia-open"]'), prev = b.previousElementSibling; return prev && prev.dataset.act === "import"; }), "Settings, Data and Backups, Export: Import From Another App right after Import from a Backup File");
    await page.click('dialog[open] [data-act="ia-open"]'); await page.waitForSelector("dialog[open] .ia-sheet");
    const sheet = await page.textContent("dialog[open] .ia-sheet");
    ok(["Anki", "Quizlet", "Todoist", "Notion", "nothing is uploaded", "Choose a File"].every(w => sheet.includes(w)), "the sheet lists the four apps with how to export from each");
    ok(!/—/.test(sheet), "no em dashes in the copy");
    await page.evaluate(() => document.querySelector("dialog[open]").close());
    await clickAct("fab-deck"); await page.waitForSelector('dialog[open] .fab-menu [data-act="ia-open"]');
    ok(true, "the Add Deck menu offers Import From Another App");
    await page.click('dialog[open] .fab-menu [data-act="ia-open"]'); await page.waitForSelector("dialog[open] .ia-sheet");

    // Anki, old schema
    let sum = await pick(files.apkg);
    ok(sum === "Found 3 decks, 8 cards (5 already learned, history kept).", "Anki preview: " + sum);
    const body = await page.textContent("dialog[open] .sheet-body");
    ok(/2 pictures weren't brought in/.test(body) && /1 sound wasn't brought in/.test(body) && /1 card had nothing but pictures/.test(body), "says what was left out: " + body.replace(/\s+/g, " ").slice(0, 300));
    ok(await page.evaluate(() => document.querySelectorAll("dialog[open] [data-ia-on]").length === 3 && document.querySelectorAll("dialog[open] [data-ia-course]").length === 3), "one row per deck, each with a course choice");
    await page.selectOption('dialog[open] [data-ia-course="0"]', "bio");
    await page.click("#iaGo"); await page.waitForTimeout(300);
    let st = await S();
    ok(st.decks.length === 3 && st.decks.map(d => d.name).sort().join("|") === "Biology › Cells|Chem › Cells|Spanish", "three decks: " + st.decks.map(d => d.name));
    const bio = st.decks.find(d => d.name === "Biology › Cells"), sp = st.decks.find(d => d.name === "Spanish");
    ok(bio.courseId === "bio" && sp.courseId === "", "the chosen course went on its deck");
    const rib = bio.cards.find(c => c.front === "Ribosome");
    ok(rib && rib.due === local(2026, 10, 25) && rib.seen === 5 && rib.right === 4 && rib.wrong === 1 && rib.last === local(2026, 10, 13) && rib.fs && rib.fs.s === 12 && rib.box === 4, "the review card kept its history: " + JSON.stringify(rib));
    const fresh = bio.cards.find(c => c.front === "Mitochondria\norganelle");
    ok(fresh && fresh.box === 0 && fresh.due === "" && fresh.seen === 0 && fresh.back === "Powerhouse & energy", "the new card is new");
    ok(bio.cards.some(c => c.front === "The capital of _____ is Paris." && c.back.startsWith("France")), "the cloze note became fill-in-the-blank cards");
    ok(sp.cards.find(c => c.front === "hola").fs.s === 30.5, "Anki's FSRS memory state came along");
    ok(new Set(st.decks.flatMap(d => d.cards.map(c => c.id))).size === 8, "every card has its own id");
    let t = await toastTxt();
    ok(/Imported 3 decks \(8 cards\)/.test(t) && /Undo/.test(t), "one message with Undo: " + t);
    await page.click("#toastUndo"); await page.waitForTimeout(300);
    ok((await S()).decks.length === 0, "one Undo takes the whole import back out");
    ok(!served.some(p => /fzstd/.test(p)), "the zstd decoder isn't loaded for an old-style file");

    // Anki, newer schema
    await clickAct("ia-open"); await page.waitForSelector("dialog[open] .ia-sheet");
    sum = await pick(files.apkg21b);
    ok(sum === "Found 3 decks, 8 cards (5 already learned, history kept).", "anki21b preview: " + sum);
    ok(served.some(p => p === "/vendor/fzstd-0.1.1.umd.js"), "the vendored decoder was loaded only now");
    await page.click("#iaGo"); await page.waitForTimeout(300);
    st = await S();
    ok(st.decks.length === 3 && st.decks.some(d => d.cards.some(c => c.front === "The capital of France is _____ (city).")), "decks and cloze cards from collection.anki21b");
    ok(await page.evaluate(() => document.body.textContent.includes("Spanish") && document.body.textContent.includes("Chem › Cells")), "the Flashcards page shows the imported decks");

    // Todoist CSV
    await clickAct("ia-open"); await page.waitForSelector("dialog[open] .ia-sheet");
    sum = await pick(files.todoist);
    ok(sum === "Found 2 tasks.", "Todoist preview: " + sum);
    ok(await page.$eval('dialog[open] [data-ia-course="0"]', s => s.value) === "bio", "the course whose code is in the file name is picked");
    ok(/1 sub-task becomes a checklist step/.test(await page.textContent("dialog[open] .sheet-body")), "sub-tasks are explained");
    await page.click("#iaGo"); await page.waitForTimeout(300);
    st = await S();
    const lab = st.tasks.find(x => x.title === "Lab 3 write-up"), quiz = st.tasks.find(x => x.title === "Pre-lab quiz");
    ok(lab && lab.courseId === "bio" && lab.due === "2026-10-30" && lab.priority === "urgent" && lab.checklist.length === 1 && lab.checklist[0].text === "Graph the data" && /Section: Labs/.test(lab.notes), "a Todoist task: " + JSON.stringify(lab && {d: lab.due, p: lab.priority, c: lab.checklist, n: lab.notes}));
    ok(quiz && quiz.due && new Date(quiz.due + "T12:00").getDay() === 5, "a repeating task gets its next date: " + (quiz && quiz.due));

    // Notion: a ZIP inside the ZIP
    await clickAct("ia-open"); await page.waitForSelector("dialog[open] .ia-sheet");
    sum = await pick(files.notion);
    ok(sum === "Found 1 task, 2 cards in 1 deck, 1 note.", "Notion preview: " + sum);
    const nb = await page.textContent("dialog[open] .sheet-body");
    ok(/1 finished task was left out/.test(nb) && /1 picture wasn't brought in/.test(nb), "what was left out: " + nb.replace(/\s+/g, " ").slice(0, 300));
    await page.click("#iaGo"); await page.waitForTimeout(300);
    st = await S();
    const note = st.notes.find(x => /^Course Notes/.test(x.text));
    ok(note && note.text === "Course Notes\n\nWeek 1\n\n• Cells are the unit of life\n☐ Read chapter 1", "a Notion page as a note: " + JSON.stringify(note && note.text));
    ok(!st.notes.some(x => /^Essay draft/.test(x.text)), "a database row's page isn't a note too");
    ok(st.tasks.some(x => x.title === "Essay draft" && x.due === "2026-10-28") && !st.tasks.some(x => x.title === "Old one"), "the task database became tasks");
    ok(st.decks.some(d => d.name === "Vocab" && d.cards.length === 2), "the Term/Definition database became a deck");
    ok(/Imported 1 deck \(2 cards\), 1 task, 1 note/.test(await toastTxt()), "the message sums it up");

    // a file dropped on the sheet
    await clickAct("ia-open"); await page.waitForSelector("dialog[open] .ia-sheet");
    await page.evaluate(() => {
      const dt = new DataTransfer(); dt.items.add(new File(["TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE\ntask,Dropped task,,1,1,,,tomorrow\n"], "Inbox.csv", {type: "text/csv"}));
      const el = document.querySelector("#iaDrop"); el.dispatchEvent(new DragEvent("dragover", {bubbles: true, cancelable: true, dataTransfer: dt})); el.dispatchEvent(new DragEvent("drop", {bubbles: true, cancelable: true, dataTransfer: dt}));
    });
    await page.waitForSelector("#iaSum");
    ok((await page.textContent("#iaSum")).trim() === "Found 1 task.", "a dropped file is read the same way");
    await page.click("#iaGo"); await page.waitForTimeout(200);
    ok((await S()).tasks.some(x => x.title === "Dropped task"), "and imported");

    // something that isn't an export
    await clickAct("ia-open"); await page.waitForSelector("dialog[open] .ia-sheet");
    await page.setInputFiles("#iaFile", {name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(100, 7)});
    await page.waitForFunction(() => (document.querySelector("#iaMsg") || {}).textContent.length > 20);
    ok(/Anki files/.test(await page.textContent("#iaMsg")), "an unknown file gets a plain explanation");
    await page.setInputFiles("#iaFile", {name: "broken.apkg", mimeType: "application/zip", buffer: Buffer.from("PK\u0003\u0004 not really a zip")});
    await page.waitForFunction(() => /couldn't read/.test((document.querySelector("#iaMsg") || {}).textContent));
    ok(true, "a broken file says it couldn't be read");

    // Quizlet: Paste Cards
    await page.click('dialog[open] [data-act="ia-quizlet"]'); await page.waitForTimeout(200);
    ok(/Paste Cards/.test(await page.textContent("dialog[open] .sheet-head")), "Quizlet opens Paste Cards");
    await page.evaluate(() => document.querySelector("dialog[open]").close());

    // a 390px phone
    await page.setViewportSize({width: 390, height: 800});
    await clickAct("ia-open"); await page.waitForSelector("dialog[open] .ia-sheet");
    await pick(files.apkg);
    ok(await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d.scrollWidth <= d.clientWidth + 1 && document.documentElement.scrollWidth <= 391; }), "the preview fits a phone screen");
    await page.evaluate(() => document.querySelector("dialog[open]").close());
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); fs.rmSync(tmp, {recursive: true, force: true}); }
  console.log(`\nimport-apps.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
