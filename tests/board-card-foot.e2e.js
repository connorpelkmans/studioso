// node tests/board-card-foot.e2e.js [screenshot folder]
// Task Board on a phone: the drag handle ends the title's row, so the lines under the title get the card's full width. A task's
// "D2L · Assignment · Mon, Nov 23, 7:00 AM" stays on one line at rest, as it does on the copy being dragged (it used to wrap at rest,
// where a strip down the card's right edge was kept clear for the handle). Dragging by the handle still lifts the card.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html"), SHOTS = process.argv[2] || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, settings: {capacity: 15}, notes: [], files: [], events: [], decks: [],
  courses: [{id: "c1", name: "Nursing", code: "BSNC 1030", color: "#C0563A"}],
  tasks: [{id: "t1", title: "Sim (CH2) Reflection", courseId: "c1", type: "Assignment", due: "2026-11-23", time: "07:00", status: "todo", priority: "med", created: 1, bs: {ou: "1", key: "1|x", url: "https://example.com"}},
    {id: "t2", title: "Final Clinical Evaluation", courseId: "c1", type: "Exam", due: "2026-11-19", time: "18:00", status: "todo", priority: "med", created: 2}]};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, deviceScaleFactor: SHOTS ? 3 : 1, locale: "en-US"});
    await ctx.clock.install({time: new Date(2026, 10, 14, 16, 28)});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(FILE); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "board"; S.ui.bview = "board"; S.render(); }); await page.waitForTimeout(600);
    const sel = '.board .card[data-id="t1"]';
    await page.waitForSelector(sel);
    const lines = s => page.evaluate(s => { const c = document.querySelector(s); if (!c) return null; const f = c.querySelector(".card-foot"), ts = [...f.children].filter(x => x.getClientRects().length).map(x => x.getBoundingClientRect().top).sort((a, b) => a - b), tops = new Set(ts.map(t => Math.round((t - ts[0]) / 12)));   // (a badge can sit a pixel or two off the text)
      const g = c.querySelector(".card-title > .card-grip"), t = c.querySelector(".card-title"); return {lines: tops.size, text: f.innerText.replace(/\s+/g, " ").trim(), grip: g && getComputedStyle(g).display !== "none" ? {inTitle: true, mid: Math.abs((g.getBoundingClientRect().top + g.getBoundingClientRect().height / 2) - (t.getBoundingClientRect().top + t.getBoundingClientRect().height / 2)) < 3} : null}; }, s);
    const rest = await lines(sel);
    ok(rest.grip && rest.grip.inTitle && rest.grip.mid, "the drag handle ends the title's row, level with it");
    ok(rest.lines === 1 && /Nov 23/.test(rest.text), `at rest, the task's details fit on one line ("${rest.text}")`);
    if (SHOTS) await page.locator(sel).screenshot({path: path.join(SHOTS, "card-rest.png")});
    // drag by the handle
    const g = await page.locator(sel + " .card-grip").boundingBox(), x = g.x + g.width / 2, y = g.y + g.height / 2;
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, px, py) => cdp.send("Input.dispatchTouchEvent", {type, touchPoints: type === "touchEnd" ? [] : [{x: px, y: py, id: 1}]});
    await touch("touchStart", x, y); await page.waitForTimeout(60);
    for (let i = 1; i <= 6; i++) { await touch("touchMove", x - i * 6, y + i * 8); await page.waitForTimeout(40); }
    const ghostSel = await page.evaluate(() => { const g = [...document.querySelectorAll(".card")].find(c => c.dataset.id === "t1" && !c.closest(".board")); if (g) g.setAttribute("data-test-ghost", "1"); return !!g; });
    ok(ghostSel, "dragging by the handle lifts a copy of the card");
    const lifted = await lines('[data-test-ghost="1"]');
    ok(lifted && lifted.lines === 1 && lifted.text === rest.text, `the lifted copy shows the same one line ("${lifted && lifted.text}")`);
    if (SHOTS) await page.locator('[data-test-ghost="1"]').screenshot({path: path.join(SHOTS, "card-drag.png")});
    await touch("touchEnd"); await page.waitForTimeout(500);
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("board-card-foot.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
