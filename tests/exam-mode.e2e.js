// Exam Mode in the real app
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbexm-"));
fs.mkdirSync(OUT, {recursive: true});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 21, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const card = (id, o) => Object.assign({id, front: "Q " + id, back: "A " + id, box: 1, due: plus(-1), seen: 2, right: 1, wrong: 1}, o || {});
const SEED = {v: 2, courses: [{id: "bio", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "his", name: "History", code: "HIS 200", color: "#1E9E74"}],
  tasks: [
    {id: "ex1", title: "Midterm 2", courseId: "bio", type: "Exam", due: plus(2), time: "09:00", weight: 25, remote: "no", remoteSrc: "user", status: "todo", start: plus(2)},
    {id: "lab4", title: "Lab 4", courseId: "bio", type: "Lab", due: plus(1), time: "23:59", hours: 2, status: "todo", start: plus(0)},
    {id: "ess", title: "Reform essay", courseId: "his", type: "Assignment", due: plus(2), time: "23:59", hours: 2, status: "todo", start: plus(0)},
    {id: "src", title: "Source list", courseId: "his", type: "Assignment", due: plus(3), hours: 1, status: "todo", start: plus(0)},
    {id: "far", title: "Reading log", courseId: "his", type: "Reading", due: plus(9), hours: 1, status: "todo", start: plus(0)}],
  decks: [
    {id: "dh", name: "Reform Era", courseId: "his", created: 1, cards: [card("h1"), card("h2")]},
    {id: "db", name: "Cell Biology", courseId: "bio", created: 2, cards: [card("b1"), card("b2")]}],
  notes: [], files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};
const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; Object.assign(b.dataset, x || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, " ").trim() : ""; }, sel);
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight); }, sel);
const toPlan = async page => { await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "board"; S.ui.bview = "plan"; S.render(); }); await page.waitForTimeout(150); };
const setTask = (page, id, patch) => page.evaluate(([id, p]) => { const S = window.__sbSync, t = S.clone(S.state.tasks[id]); S.applyChanges([{kind: "task", id, after: Object.assign(t, p)}], null); }, [id, patch]);

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const [W, H] of [[1280, 800], [390, 844]]) {
      console.log("== " + W);
      const ctx = await browser.newContext({viewport: {width: W, height: H}});
      await ctx.clock.install({time: NOW});
      await ctx.addInitScript(seed => {
        window.__SB_TEST = true;
        try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {}
      }, SEED);
      const page = await ctx.newPage(); const errs = [];
      page.on("pageerror", e => errs.push(e.message));
      page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
      await page.goto(FILE); await page.waitForTimeout(1500);
      await page.waitForFunction(() => window.__sbSync && window.SBEXAM);
      await toPlan(page);

      ok(await vis(page, ".exm-card"), "the Exam Mode card shows on Today's Plan");
      const c = await txt(page, ".exm-card");
      ok(/Exam Mode/i.test(c) && /Midterm 2/.test(c) && (W < 640 || /BIO 101/.test(c)) && /In 2 days/.test(c), "it names the exam, course (left out of the phone strip, which takes the course colour) and countdown: " + c);
      ok(await page.evaluate(() => { const a = document.querySelector(".exm-card"), b = document.querySelector("section.focus.plan"); return !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); }), "the card sits above Today's Plan");
      ok(await page.evaluate(() => !document.querySelector(".exm-also") && !/Also Due/.test(document.querySelector(".exm-card").innerText)), "no Also Due list: that work is already in Do This Next");
      ok(await page.evaluate(() => !document.querySelector(".exm-card [title]") && /Study for It/.test(document.querySelector(".exm-card [data-act=exm-study]").textContent) && /Not Now/.test(document.querySelector(".exm-card [data-act=exm-off]").textContent)), "Study for It and Not Now buttons, no tooltips");
      ok(!/[—]/.test(c), "no em dashes in the card");
      await page.screenshot({path: path.join(OUT, `today-${W}.png`), fullPage: false});

      const plan = await page.evaluate(() => window.__sbPlan());
      ok(plan.next && plan.next.id === "lab4", "Do This Next is Lab 4, due before the exam: " + JSON.stringify(plan.next));
      const nu = (await page.textContent(".next-up")).replace(/\s+/g, " ");
      ok(/Lab 4/.test(nu) && /Due before your exam/.test(nu), "Do This Next says why: " + nu.slice(0, 160));
      const shown = await page.evaluate(() => [...document.querySelectorAll(".next-up .nu-title, section.plan .plan-row .task-title")].map(e => e.innerText));
      ok(shown.some(t => /Lab 4/.test(t)), "Lab 4 is on Today's Plan");
      await page.evaluate(() => { const b = document.createElement("button"), pb = document.querySelector(".next-up [data-act=pomo-task]"), id = document.querySelector(".next-up .nu-title").dataset.id; b.dataset.act = "nu-skip"; b.dataset.id = pb && pb.dataset.study ? "study:" + id : id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(250);
      ok(/Reform essay/.test(await txt(page, ".next-up .nu-title")) && /Due on your exam day/.test(await txt(page, ".next-up .nu-why")), "after skipping: the other course's essay, due on the exam day");
      await page.evaluate(() => { const b = document.createElement("button"), pb = document.querySelector(".next-up [data-act=pomo-task]"), id = document.querySelector(".next-up .nu-title").dataset.id; b.dataset.act = "nu-skip"; b.dataset.id = pb && pb.dataset.study ? "study:" + id : id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(250);
      const nu2 = await txt(page, ".next-up .nu-title");
      ok(/Study for Midterm 2/.test(nu2), "then exam study: " + nu2);
      ok(/Exam in 2 days/.test(await txt(page, ".next-up .nu-why")), "with the countdown chip");
      await page.evaluate(() => { const b = document.createElement("button"), pb = document.querySelector(".next-up [data-act=pomo-task]"), id = document.querySelector(".next-up .nu-title").dataset.id; b.dataset.act = "nu-skip"; b.dataset.id = pb && pb.dataset.study ? "study:" + id : id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(250);
      ok(/Source list/.test(await txt(page, ".next-up .nu-title")), "then the source list (due after the exam, in the window)");
      await page.evaluate(() => { localStorage.removeItem("studyboard:nextSkip"); window.__sbSync.ui.skipNext = null; window.__sbSync.render(); }); await page.waitForTimeout(150);

      await setTask(page, "lab4", {status: "done", doneAt: Date.now()}); await setTask(page, "ess", {status: "done", doneAt: Date.now()}); await toPlan(page);
      ok(/Study for Midterm 2/.test(await txt(page, ".next-up .nu-title")), "with the lab and essay done, Study for Midterm 2 leads Do This Next");
      await setTask(page, "lab4", {status: "todo", doneAt: null}); await setTask(page, "ess", {status: "todo", doneAt: null}); await toPlan(page);

      await page.evaluate(() => { localStorage.removeItem("studioso:pomo"); });
      await act(page, "pomo-open"); await page.waitForTimeout(250);
      ok(await page.evaluate(() => document.querySelector("#pomoTask").value) === "lab4", "the Focus timer suggests Lab 4 (the most urgent, before the exam)");
      ok(/Exam Mode/i.test(await txt(page, "#pomoDlg .exm-pomo")) && /Midterm 2 is in 2 days/.test(await txt(page, "#pomoDlg .exm-pomo")), "and says Exam Mode is on");
      await page.evaluate(() => document.querySelector("#pomoDlg").close());
      await setTask(page, "lab4", {status: "done", doneAt: Date.now()}); await setTask(page, "ess", {status: "done", doneAt: Date.now()});
      await page.evaluate(() => { localStorage.removeItem("studioso:pomo"); });
      await act(page, "pomo-open"); await page.waitForTimeout(250);
      ok(await page.evaluate(() => document.querySelector("#pomoTask").value) === "ex1", "with the lab and essay done, Focus points at studying for the exam");
      await page.evaluate(() => document.querySelector("#pomoDlg").close());
      await setTask(page, "lab4", {status: "todo", doneAt: null}); await setTask(page, "ess", {status: "todo", doneAt: null});

      await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.deckId = null; S.ui.fc = null; S.render(); }); await page.waitForTimeout(200);
      const decks = await page.evaluate(() => [...document.querySelectorAll(".deck-grid .deck")].map(d => ({name: d.querySelector(".deck-name").innerText, tag: (d.querySelector(".exm-tag") || {}).innerText || ""})));
      ok(decks.length === 2 && decks[0].name === "Cell Biology" && decks[1].name === "Reform Era", "the BIO deck sorts first: " + decks.map(d => d.name));
      ok(decks[0].tag === "Exam in 2 days" && !decks[1].tag, "with an Exam in 2 days tag, only on that course's deck");
      await page.screenshot({path: path.join(OUT, `decks-${W}.png`)});
      await act(page, "fc-review-all"); await page.waitForTimeout(200);
      const q = await page.evaluate(() => window.__sbSync.ui.fc.q.map(x => x.deckId));
      ok(q.length === 4 && q[0] === "db" && q[1] === "db" && q[2] === "dh", "Review starts with the exam's course: " + q.join());
      await page.evaluate(() => { const S = window.__sbSync; S.ui.fc = null; S.render(); });

      await toPlan(page); await page.click(".exm-card [data-act=exm-study]"); await page.waitForTimeout(250);
      ok(await page.evaluate(() => { const f = window.__sbSync.ui.fc; return !!f && f.mode === "study" && f.deckIds.join() === "db"; }), "Study for It starts the course's due cards");
      await page.evaluate(() => { const S = window.__sbSync; S.ui.fc = null; S.render(); });

      await page.evaluate(() => window.__sbSync.menuSheet()); await page.waitForTimeout(300);
      ok(await page.evaluate(() => { const i = document.querySelector('#dlg input[data-act="exm-toggle"]'); return !!i && i.checked; }), "Settings has an Exam Mode row, on by default");
      await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });

      await toPlan(page);
      await page.click(".exm-card [data-act=exm-off]"); await page.waitForTimeout(250);
      ok(!(await vis(page, ".exm-card")), "Not Now hides the card");
      ok(await page.evaluate(() => !!JSON.parse(localStorage.getItem("studyboard:exammode:off") || "{}").ex1), "and remembers it on this device for that exam");
      ok(await page.evaluate(() => window.SBEXAM.current() === null && window.SBEXAM.deckTag(window.__sbSync.state.decks.db) === ""), "the mode is off everywhere for it (no deck tag)");
      ok((await page.evaluate(() => window.__sbPlan().next.id)) === "lab4", "Do This Next still has the lab");
      await page.reload(); await page.waitForTimeout(1200); await page.waitForFunction(() => window.__sbSync && window.SBEXAM); await toPlan(page);
      ok(!(await vis(page, ".exm-card")), "still off after a reload");
      await page.evaluate(() => { localStorage.removeItem("studyboard:exammode:off"); window.__sbSync.render(); }); await page.waitForTimeout(150);
      ok(await vis(page, ".exm-card"), "back on when the Not Now is cleared");
      await page.click(".exm-card [data-act=exm-off]"); await page.waitForTimeout(200);
      await page.click("#toastUndo"); await page.waitForTimeout(250);
      ok(await vis(page, ".exm-card"), "Undo after Not Now brings it back");

      await page.evaluate(() => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, {examMode: false}); S.render(); }); await page.waitForTimeout(150);
      ok(!(await vis(page, ".exm-card")) && (await page.evaluate(() => window.SBEXAM.current())) === null, "the setting turns Exam Mode off");
      await page.evaluate(() => { const S = window.__sbSync; S.state.settings = Object.assign({}, S.state.settings, {examMode: true}); S.render(); }); await page.waitForTimeout(150);

      if (W === 390) {
        ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal page scroll at 390px");
        ok(await page.evaluate(() => { const r = document.querySelector(".exm-card").getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth + 1; }), "the card fits the phone");
        ok(await page.evaluate(() => [...document.querySelectorAll(".exm-card button")].filter(b => b.offsetParent).every(b => b.getBoundingClientRect().height >= 30)), "its buttons are big enough to tap");
      }

      await setTask(page, "ex1", {due: plus(5)}); await toPlan(page);
      ok(!(await vis(page, ".exm-card")), "no card with the exam 5 days out");
      ok((await page.evaluate(() => window.__sbPlan().next.id)) === "lab4" && (await page.evaluate(() => window.SBEXAM.current())) === null, "and Do This Next is the normal ranking");
      await setTask(page, "ex1", {due: plus(0), time: "07:30"}); await toPlan(page);
      ok(!(await vis(page, ".exm-card")) && (await page.evaluate(() => window.SBEXAM.current())) === null, "off once the exam has happened");
      await setTask(page, "ex1", {due: plus(0), time: "15:00"}); await toPlan(page);
      ok(/In about 5 hours/.test(await txt(page, ".exm-card")), "exam day shows hours left: " + await txt(page, ".exm-card .exm-when"));

      await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
      ok(await page.evaluate(() => { const s = getComputedStyle(document.querySelector(".exm-title")); return s.color !== getComputedStyle(document.querySelector(".exm-card")).backgroundColor; }), "dark theme: text and background differ");
      await page.screenshot({path: path.join(OUT, `dark-${W}.png`)});

      ok(errs.length === 0, "no console errors: " + errs.join("; "));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`exam-mode.e2e.js: ${n} checks passed. Screenshots in ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
