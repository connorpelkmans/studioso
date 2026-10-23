// node tests/linked-items.e2e.js (Playwright + Chromium; see tests/pw.js) Linked items
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const note = (id, text, extra) => Object.assign({id, text, color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "c1", created: 1}, extra || {});
const task = (id, title, extra) => Object.assign({id, title, courseId: "c1", type: "Assignment", start: day(0), due: day(7), status: "todo", priority: "med", order: 1, checklist: [], dependsOn: [], history: []}, extra || {});
const card = (id, front, extra) => Object.assign({id, front, back: front + " back", box: 0, due: "", seen: 0, right: 0, wrong: 0}, extra || {});
function SEED(){
  const many = Array.from({length: 8}, (_, i) => note("m" + i, `Big note ${i + 1}\nsome text`, {taskId: "t3", x: 40 + i * 30}));
  return {v: 2, courses: [{id: "c1", name: "Cell Biology", code: "BIO 101", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1,
    tasks: [task("t1", "Lab Report 3"), task("t2", "Reading Response"), task("t3", "Group Project"),
      task("t4", "Midterm", {type: "Exam", due: day(10), prep: {v: 1, topics: [{id: "pt1", name: "Membranes", conf: "ok", links: [{k: "deck", id: "d2", title: "Lab Report 3 Review"}, {k: "quiz", id: "q1", deckId: "d1", title: "Practice Quiz"}]}]}})],
    notes: [note("n1", "Lab plan\nUse the figures in [[Cell Biology Deck]] and the [[Lab handout]].", {taskId: "t1"}),
      note("n2", "Week 6\nStart [[Lab Report 3]] on Monday.", {x: 300}),
      note("n3", "Membrane notes\nOsmosis - water across a membrane", {x: 560}),
      note("n4", "Revision\nGo over [[Lecture Deck]] twice.", {x: 800}),
      note("n5", "Unrelated\nnothing linked here", {x: 1000})].concat(many),
    decks: [{id: "d1", name: "Cell Biology Deck", courseId: "c1", created: 1, quizzes: [], cards: [card("k1", "ATP"), card("k2", "Osmosis")],
        aiQuizzes: [{id: "q1", title: "Practice Quiz", style: "", sources: [], results: [], questions: [{id: "qq1", type: "single", stem: "What makes ATP?", options: ["Mitochondria", "Ribosome"], correct: [0], answer: "", rationale: "", notes: [], topic: "", source: ""}, {id: "qq2", type: "single", stem: "Water across a membrane?", options: ["Osmosis", "Diffusion"], correct: [0], answer: "", rationale: "", notes: [], topic: "", source: ""}]}]},
      {id: "d2", name: "Lab Report 3 Review", courseId: "c1", created: 2, quizzes: [], aiQuizzes: [], cards: [card("k3", "Hypothesis")]},
      {id: "d3", name: "Lecture Deck", courseId: "c1", created: 3, quizzes: [], aiQuizzes: [], origins: [{k: "lecture", id: "lec1", at: day(-3)}],
        cards: [card("k4", "Aquaporin", {from: {k: "lecture", id: "lec1", at: day(-3)}}), card("k5", "Osmosis", {srcNote: "n3"}), card("k6", "Tonicity", {src: {f: "pdf1", p: 2}})]}],
    files: [{id: "f1", name: "Lab handout", courseId: "c1", folderId: "other", kind: "link", url: "https://example.com/handout", revs: [], taskIds: ["t1"], desc: ""},
      {id: "lec1", name: "Lecture 4: Membranes", courseId: "c1", folderId: "lectures", kind: "file", revs: [], taskIds: [], desc: "", created: Date.now() - 3 * 864e5, tr: {text: "Today we cover membranes and osmosis."}},
      {id: "pdf1", name: "Chapter 4.pdf", courseId: "c1", folderId: "other", kind: "file", revs: [{id: "r1", name: "Chapter 4.pdf", type: "application/pdf", size: 10, assetId: "a1", at: 1}], taskIds: [], desc: ""}]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const open = async (opts = {}) => {
    const ctx = await browser.newContext({viewport: {width: opts.w || 1280, height: opts.h || 900}, hasTouch: !!opts.touch, isMobile: !!opts.touch, colorScheme: opts.dark ? "dark" : "light"});
    await ctx.addInitScript(([seed, dark]) => {
      window.__SB_TEST = true;
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); if (dark) localStorage.setItem("studioso:theme", "dark"); } } catch (e) {}
    }, [SEED(), !!opts.dark]);
    const page = await ctx.newPage();
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbSync && window.SBLINKED);
    await page.waitForTimeout(300);
    page.ctx = ctx; return page;
  };
  const S = "window.__sbSync";
  const openTask = async (page, id) => { await page.evaluate(([s, id]) => { const T = eval(s); if (T.dlg.open) T.dlg.close(); const b = document.createElement("button"); b.dataset.act = "edit-task"; b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [S, id]); await page.waitForSelector("#dlg[open] form.sheet"); };
  const chips = page => page.evaluate(() => [...document.querySelectorAll("#dlg .lk-row .lk-chip:not(.lk-more)")].map(b => ({k: (b.className.match(/(?:^|\s)k-(\w+)/) || [])[1], id: b.dataset.id, name: b.querySelector(".lk-n").textContent, sr: b.querySelector(".sr").textContent, shown: !!b.offsetParent})));
  const goDeck = async (page, id) => { await page.evaluate(([s, id]) => { const T = eval(s); if (T.dlg.open) T.dlg.close(); T.ui.tab = "flashcards"; T.ui.fc = null; T.ui.deckId = id; T.render(); }, [S, id]); await page.waitForSelector(`[data-fc-deck="${id}"]`); };
  const deckChips = page => page.evaluate(() => [...document.querySelectorAll("#view .lk-row .lk-chip:not(.lk-more)")].map(b => ({k: (b.className.match(/(?:^|\s)k-(\w+)/) || [])[1], id: b.dataset.id, name: b.querySelector(".lk-n").textContent, sr: b.querySelector(".sr").textContent})));
  try {
    {
      const page = await open();
      // a task with an attached note, a note that links it
      await openTask(page, "t1");
      let cs = await chips(page);
      ok(JSON.stringify(cs.map(c => c.k + ":" + c.id)) === JSON.stringify(["note:n1", "note:n2", "deck:d1", "file:f1"]), "Lab Report 3 links exactly its note, the note that mentions it, the deck its note links and its file: " + JSON.stringify(cs.map(c => c.k + ":" + c.id)));
      ok(!cs.some(c => c.id === "d2"), "a deck that only sounds like the task (Lab Report 3 Review) is not guessed in");
      ok(cs[0].name === "Lab plan" && cs[1].name === "Week 6" && cs[2].name === "Cell Biology Deck" && cs[3].name === "Lab handout", "chips show the plain names");
      ok(cs[0].sr === "Note: " && cs[1].sr === "Note that links here: " && cs[2].sr === "Deck: " && cs[3].sr === "File: ", "screen readers hear what each chip is: " + cs.map(c => c.sr).join("|"));
      ok(await page.evaluate(() => { const r = document.querySelector("#dlg .lk-row"); return r.getAttribute("role") === "group" && r.getAttribute("aria-label") === "Linked" && !document.querySelector("#dlg .lk-row [title]") && !document.querySelector("#dlg .lk-more"); }), "one Linked group, no tooltips, no +more for four items");
      ok(await page.evaluate(() => { const r = document.querySelector("#dlg .lk-row"), b = document.querySelector("#dlg .sheet-body"); return r.closest(".sheet-body") === b && r.compareDocumentPosition(b.querySelector("input[name=title]")) & Node.DOCUMENT_POSITION_FOLLOWING; }), "the row sits at the top of the task sheet, above the fields");
      await page.click('#dlg .lk-chip[data-id="n1"]');
      await page.waitForFunction(() => window.__sbSync.ui.tab === "notes" && !document.querySelector("#dlg").open);
      ok(!!(await page.$('.note[data-note="n1"]')), "the attached note chip opens the note on its board");
      await openTask(page, "t1"); await page.click('#dlg .lk-chip[data-id="n2"]');
      await page.waitForFunction(() => window.__sbSync.ui.tab === "notes" && !!document.querySelector('.note[data-note="n2"]'));
      ok(true, "the mentioning note chip opens that note");
      await openTask(page, "t1"); await page.focus('#dlg .lk-chip[data-id="d1"]'); await page.keyboard.press("Enter");
      await page.waitForFunction(() => window.__sbSync.ui.tab === "flashcards" && window.__sbSync.ui.deckId === "d1");
      ok(!!(await page.$('[data-fc-deck="d1"]')), "the deck chip opens the deck page (with the keyboard)");
      await openTask(page, "t1"); await page.click('#dlg .lk-chip[data-id="f1"]');
      await page.waitForFunction(() => document.querySelector("#dlg").open && (document.querySelector('#dlg input[name="name"]') || {}).value === "Lab handout" && !document.querySelector("#dlg .lk-row"));
      ok(true, "the file chip opens the file");

      // nothing linked
      await openTask(page, "t2");
      ok(await page.evaluate(() => !document.querySelector("#dlg .lk-row") && !/\bLinked\b/.test(document.querySelector("#dlg .sheet-body").innerText.split("\n").slice(0, 6).join(" "))), "a task with nothing linked shows no Linked section at all");

      // Exam Prep material on an exam
      await openTask(page, "t4");
      cs = await chips(page);
      ok(JSON.stringify(cs.map(c => c.k + ":" + c.id)) === JSON.stringify(["deck:d2", "quiz:q1"]), "an exam shows the deck and quiz its prep plan links: " + JSON.stringify(cs.map(c => c.k + ":" + c.id)));
      await page.click('#dlg .lk-chip[data-id="q1"]');
      await page.waitForFunction(() => window.__sbSync.ui.fc && window.__sbSync.ui.fc.mode === "aiquiz");
      ok(true, "the quiz chip starts the quiz");

      // collapse beyond 6
      await openTask(page, "t3");
      cs = await chips(page);
      ok(cs.length === 8 && cs.filter(c => c.shown).length === 5, "eight linked notes: five chips shown");
      ok((await page.textContent("#dlg .lk-more")).trim() === "+3 more linked items" && await page.evaluate(() => document.querySelector("#dlg .lk-more .sr").textContent === " linked items"), "the rest fold into +3 more");
      await page.focus("#dlg .lk-more"); await page.keyboard.press("Enter");
      cs = await chips(page);
      ok(cs.filter(c => c.shown).length === 8 && !(await page.$("#dlg .lk-more")), "+3 more shows the rest in place and goes away");
      ok(await page.evaluate(() => document.activeElement && document.activeElement.dataset.id === "m5"), "focus moves to the first chip that was folded");
      ok(await page.evaluate(() => document.querySelector("#dlg").open && document.querySelector("#dlg form.sheet")), "expanding keeps the task sheet (and any edits) open");

      // deck pages
      await goDeck(page, "d3");
      let dc = await deckChips(page);
      ok(JSON.stringify(dc.map(c => c.k + ":" + c.id)) === JSON.stringify(["lecture:lec1", "file:pdf1", "note:n3", "note:n4"]), "a deck made from a lecture, a PDF and a note shows them, then the note linking it: " + JSON.stringify(dc.map(c => c.k + ":" + c.id)));
      ok(dc[0].sr === "Made from lecture: " && dc[1].sr === "Made from PDF: " && dc[2].sr === "Made from note: " && dc[3].sr === "Note that links here: ", "each origin says it is where the cards were made from: " + dc.map(c => c.sr).join("|"));
      ok((await page.textContent("#view .lk-row .lk-h")) === "Linked", "mixed origins and mentions: labelled Linked");
      await page.click('#view .lk-chip[data-id="lec1"]');
      await page.waitForSelector("#dlg[open] .lec-view");
      ok(/Lecture 4: Membranes/.test(await page.textContent("#dlg")), "the lecture chip opens the lecture");
      await page.evaluate(() => window.__sbSync.dlg.close());
      await goDeck(page, "d1");
      dc = await deckChips(page);
      ok(dc.length === 1 && dc[0].id === "n1", "a deck with no stored origin shows only the note that links it");
      await goDeck(page, "d2");
      ok(!(await page.$("#view .lk-row")), "a deck with nothing linked shows no row");
      await page.evaluate(() => { const T = window.__sbSync, d = T.clone(T.state.decks.d2); d.cards[0].srcNote = "n5"; T.applyChanges([{kind: "deck", id: "d2", after: d}], null); });
      await page.waitForSelector("#view .lk-row");
      ok((await page.textContent("#view .lk-row .lk-h")) === "Made From" && (await deckChips(page)).map(c => c.id).join() === "n5", "a deck made from a note (card.srcNote) shows Made From and the note");
      await page.click('#view .lk-chip[data-id="n5"]');
      await page.waitForFunction(() => window.__sbSync.ui.tab === "notes" && !!document.querySelector('.note[data-note="n5"]'));
      ok(true, "the origin note chip opens the note");

      // the shared origin format
      const st = await page.evaluate(() => {
        const L = window.SBLINKED, T = window.__sbSync, d = T.clone(T.state.decks.d2), fresh = [{id: "x1", front: "a", back: "b"}, {id: "x2", front: "c", back: "d"}];
        d.cards = d.cards.concat(fresh);
        L.stamp(d, [L.origin("lecture", "lec1")], d.cards.slice(-2));
        L.stamp(d, [L.origin("lecture", "lec1"), L.origin("note", "n3")], []);
        const many = {origins: []}; for (let i = 0; i < 25; i++) L.stamp(many, [{k: "note", id: "z" + i}], []);
        return {origins: d.origins, from: d.cards.slice(-2).map(c => c.from), old: d.cards[0].from || null, many: many.origins.length, last: many.origins[19].id, bad: L.origin("note", "nope"), today: L.origin("note", "n3").at};
      });
      ok(st.origins.length === 2 && st.origins[0].k === "lecture" && st.origins[0].id === "lec1" && /^\d{4}-\d{2}-\d{2}$/.test(st.origins[0].at) && st.origins[1].k === "note", "deck.origins = [{k, id, at}], deduplicated: " + JSON.stringify(st.origins));
      ok(st.origins[0].at === day(-3), "a lecture origin's date is the day the lecture was recorded");
      ok(st.from.every(f => f && f.k === "lecture" && f.id === "lec1" && f.at === day(-3)) && st.old === null, "card.from goes on the new cards only, when they came from one source");
      ok(st.many === 20 && st.last === "z24" && st.bad === null && st.today === day(0), "at most 20 origins (the latest kept), and nothing for a missing source");
      await page.ctx.close();
    }

    // phone width, dark theme
    {
      const page = await open({w: 390, h: 800, touch: true, dark: true});
      await openTask(page, "t3");
      const m = await page.evaluate(() => { const d = document.querySelector("#dlg"), r = d.querySelector(".lk-row"), rr = r.getBoundingClientRect(), b = d.querySelector(".sheet-body").getBoundingClientRect();
        const cs = [...r.querySelectorAll(".lk-chip")].filter(x => x.offsetParent).map(x => x.getBoundingClientRect());
        const c = getComputedStyle(r.querySelector(".lk-chip"));
        return {page: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: d.scrollWidth - d.clientWidth, inside: cs.every(x => x.left >= b.left - 0.5 && x.right <= b.right + 0.5), minH: Math.min(...cs.map(x => x.height)), rowW: rr.width, bg: c.backgroundColor, fg: c.color, theme: document.documentElement.getAttribute("data-theme")}; });
      ok(m.page <= 0 && m.dlg <= 0 && m.inside, "390px phone: no horizontal overflow, chips wrap inside the sheet " + JSON.stringify(m));
      ok(m.minH >= 43.5, "touch targets are 44px tall on a phone (" + m.minH + ")");
      ok(m.theme === "dark" && m.bg !== m.fg && !/255, 255, 255/.test(m.bg), "dark theme: chips use the dark surface " + m.bg + " / " + m.fg);
      await goDeck(page, "d3");
      const o = await page.evaluate(() => ({page: document.documentElement.scrollWidth - document.documentElement.clientWidth, n: document.querySelectorAll("#view .lk-chip").length}));
      ok(o.page <= 0 && o.n === 4, "deck page on a phone: the row fits " + JSON.stringify(o));
      await page.ctx.close();
    }
    ok(errs.length === 0, "no page errors: " + JSON.stringify(errs.slice(0, 5)));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
