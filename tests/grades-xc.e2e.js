// node tests/grades-xc.e2e.js: weights over 100% and extra credit. A course whose weights add up to more than 100% says so in
// the warning style and asks whether some of it is extra credit; ticking it (with its extra-credit weight) takes it out of the
// 100% and adds what's earned on top. "No, Fix the Weights" corrects them instead. The task form asks the same question when a
// weight takes its course past 100%. The numbers are checked by hand.
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const near = (a, b) => a != null && Math.abs(a - b) < 0.05;
const pad = x => String(x).padStart(2, "0");
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const now = Date.now();
const T = (id, title, c, type, due, o) => Object.assign({id, title, courseId: c, type, start: day(-40), due, time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10}, o || {});
const M = (got, outOf) => ({status: "done", pct: 100, doneAt: now - 3 * 864e5, mark: {got, outOf}});
const C = (id, name, code) => ({id, name, code, color: "#3B6FE0", meetings: []});
const SEED = {v: 2, updated: 1, settings: {grades: {prompt: false, pass: 60}}, events: [], notes: [], decks: [], files: [],
  courses: [C("eco", "Microeconomics", "ECON 1010"), C("bio", "Biology", "BIOL 1000"), C("his", "History", "HIST 1000")],
  tasks: [
    // ECON: 40 + 60 + 5 = 105%. The 5% bonus quiz is really extra credit.
    T("e1", "Midterm Exam", "eco", "Exam", day(-10), Object.assign({weight: 40}, M(80, 100))),
    T("e2", "Final Exam", "eco", "Exam", day(20), {weight: 60}),
    T("e3", "Bonus Quiz", "eco", "Quiz", day(-5), Object.assign({weight: 5}, M(10, 10))),
    // BIOL: 60 + 50 = 110%, a typo (the lab is really 40%)
    T("b1", "Midterm", "bio", "Exam", day(-8), Object.assign({weight: 60}, M(70, 100))),
    T("b2", "Lab Report", "bio", "Assignment", day(10), {weight: 50}),
    // HIST: exactly 100%, plus one more task added through the form
    T("h1", "Essay", "his", "Assignment", day(-6), Object.assign({weight: 50}, M(90, 100))),
    T("h2", "Final Exam", "his", "Exam", day(15), {weight: 50}),
    T("h3", "Optional Reflection", "his", "Assignment", day(12), {})]};

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch({executablePath});
  const ctx = await b.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
  await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
    new MutationObserver(() => document.querySelectorAll(".cpu,.cp").forEach(x => { try { x.hidePopover(); } catch (e) {} x.remove(); })).observe(document, {childList: true, subtree: true}); }, SEED);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await p.waitForFunction(() => window.__sbSync && window.__sbGrades, null, {timeout: 20000}); await p.waitForTimeout(600);
  const G = id => p.evaluate(id => { const g = window.__sbGrades.courseGrade(id); return {wAll: g.wAll, current: g.current, projected: g.projected, minFinal: g.minFinal, maxFinal: g.maxFinal, need60: g.need(60), xc: g.xc.length}; }, id);
  const course = async id => { await p.evaluate(id => { const d = document.querySelector("#dlg"); if (d.open) d.close(); const x = document.createElement("button"); x.dataset.act = "g-open-course"; x.dataset.id = id; x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); }, id); await p.waitForTimeout(500); };

  // 1. Before: 105% is scaled down to fit, and the course says so in the warning style
  let g = await G("eco");
  ok(near(g.wAll, 105), "ECON weights add up to 105%: " + g.wAll);
  // scaled: (32 + 5) / 45 marked = 82.2% current; the most is everything over 105
  ok(near(g.current, 37 / 45 * 100), "before: the current grade is over the marked share: " + g.current);
  ok(near(g.maxFinal, 97 / 105 * 100), "before: scaled to fit, full marks on the final gives (32 + 60 + 5) / 105 = 92.4% at most: " + g.maxFinal);
  await course("eco");
  const note = p.locator(".gr-over-note");
  ok(await note.count() === 1 && /Weights add up to 105%/.test(await note.textContent()) && /extra credit/i.test(await note.textContent()), "the warning says 105% and asks about extra credit");
  ok(await p.locator(".gr-over-note.w-est-note").count() === 1, "in the same style as the other grade warnings (w-est-note)");
  await p.screenshot({path: "/tmp/grades-xc-warning.png"});

  // 2. Yes, some is extra credit: the sheet lists each weighted item; tick the bonus quiz, keep its 5% as its extra-credit weight
  await p.click('.gr-over-note [data-act="g-xc"]'); await p.waitForSelector("#dlg[open] .xc-sheet");
  ok(await p.locator("#dlg .xc-row").count() === 3, "the sheet lists the 3 weighted items");
  ok(/Regular work adds up to 105%, still more than 100%/.test(await p.textContent("#xcSum")), "it sums the regular work live: " + await p.textContent("#xcSum"));
  await p.check('#dlg .xc-row[data-id="e3"] [data-xc="on"]');
  const sum1 = await p.textContent("#xcSum");
  ok(/Regular work adds up to 100%/.test(sum1) && /Extra credit can add up to 5% on top/.test(sum1), "ticked: 100% regular, 5% extra credit on top: " + sum1);
  ok(/Extra credit weight/.test(await p.textContent('#dlg .xc-row[data-id="e3"] [data-xc-lab]')), "the weight field is now its extra-credit weight");
  await p.screenshot({path: "/tmp/grades-xc-sheet.png"});
  await p.click("#dlg [data-submit]"); await p.waitForTimeout(400);
  ok(await p.evaluate(() => window.__sbSync.state.tasks.e3.xc === true && window.__sbSync.state.tasks.e3.weight === 5), "saved as extra credit, weight 5");

  // 3. After: 100% regular; the 5% earned (10/10 on a 5% extra credit) goes on top
  g = await G("eco");
  ok(near(g.wAll, 100) && g.xc === 1, "regular weights now 100%: " + g.wAll);
  ok(near(g.current, 85), "current: 80% on the midterm, plus 5% extra credit = 85%: " + g.current);
  ok(near(g.minFinal, 37), "secured: 32 from the midterm + 5 extra = 37%: " + g.minFinal);
  ok(near(g.maxFinal, 97), "most possible: 32 + 60 + 5 = 97%: " + g.maxFinal);
  ok(near(g.need60, (60 - 5 - 32) / 60 * 100), "to pass (60%) the final needs (60 - 5 - 32) / 60 = 38.3%: " + g.need60);
  ok(near(g.projected, 85), "projected at this pace: 0.8 x 100 + 5 = 85%: " + g.projected);
  await course("eco");
  ok(await p.locator(".gr-over-note").count() === 0, "the warning is gone");
  ok(await p.locator(".gr-xc-pill").count() === 1, "the bonus quiz is listed with an Extra Credit pill");
  await p.screenshot({path: "/tmp/grades-xc-after.png"});

  // 4. A partly earned extra credit counts its share; an unmarked one only raises what's possible
  await p.evaluate(() => { const S = window.__sbSync, t = JSON.parse(JSON.stringify(S.state.tasks.e3)); t.mark = {got: 6, outOf: 10}; S.state.tasks.e3 = t; S.render(); });
  g = await G("eco");
  ok(near(g.current, 83), "6/10 on a 5% extra credit adds 3%: 83%: " + g.current);
  await p.evaluate(() => { const S = window.__sbSync, t = JSON.parse(JSON.stringify(S.state.tasks.e3)); delete t.mark; t.status = "todo"; t.due = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10); S.state.tasks.e3 = t; S.render(); });
  g = await G("eco");
  ok(near(g.current, 80) && near(g.maxFinal, 97) && near(g.minFinal, 32), "unmarked and still open: nothing added yet (80%), up to 97% possible: " + JSON.stringify(g));

  // 5. No, fix the weights: no extra-credit boxes, just the weights
  await course("bio");
  ok(/Weights add up to 110%/.test(await p.textContent(".gr-over-note")), "BIOL warns about 110%");
  await p.click('.gr-over-note [data-act="g-xc-fix"]'); await p.waitForSelector("#dlg[open] .xc-sheet");
  ok(/Fix the Weights/.test(await p.textContent("#dlg .sheet-head")) && await p.locator("#dlg .xc-on:visible").count() === 0, "Fix the Weights shows only the weights");
  await p.fill('#dlg .xc-row[data-id="b2"] [data-xc="w"]', "40");
  ok(/Regular work adds up to 100%/.test(await p.textContent("#xcSum")), "fixed: 100%");
  await p.click("#dlg [data-submit]"); await p.waitForTimeout(400);
  g = await G("bio");
  ok(near(g.wAll, 100) && g.xc === 0 && near(g.current, 70), "BIOL now 100% with no extra credit; current 70%: " + JSON.stringify(g));
  await course("bio");
  ok(await p.locator(".gr-over-note").count() === 0, "and the warning is gone");

  // 6. The task form asks when a weight takes its course past 100%
  await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "edit-task"; b.dataset.id = "h3"; b.dataset.edit = "1"; document.body.appendChild(b); b.click(); b.remove(); });
  await p.waitForSelector("#dlg[open] input[name=weight]", {state: "attached"});
  await p.evaluate(() => { const d = document.querySelector("#dlg details:not([open])"); if (d) d.open = true; document.querySelectorAll("#dlg details").forEach(x => x.open = true); });
  ok(await p.locator("#xcAsk").isHidden(), "no question before a weight is typed");
  await p.fill("#dlg input[name=weight]", "10");
  const ask = await p.textContent("#xcAsk");
  ok(await p.locator("#xcAsk").isVisible() && /add up to 110%, more than 100%/.test(ask) && /Is this extra credit/.test(ask), "typing 10% asks whether it's extra credit: " + ask);
  await p.check("#dlg input[name=xc]");
  ok(/Extra Credit Weight/.test(await p.textContent("#wLab")) && /up to 10% on top/.test(await p.textContent("#xcAsk")), "ticked: the field is its extra-credit weight");
  await p.screenshot({path: "/tmp/grades-xc-form.png"});
  await p.click("#dlg [data-submit]"); await p.waitForTimeout(400);
  ok(await p.evaluate(() => window.__sbSync.state.tasks.h3.xc === true && window.__sbSync.state.tasks.h3.weight === 10), "saved as a 10% extra credit");
  g = await G("his");
  ok(near(g.wAll, 100) && near(g.current, 90) && near(g.maxFinal, 45 + 50 + 10), "HIST: 100% regular; 90% now; up to 105% possible: " + JSON.stringify(g));
  // unticking puts it back as regular weight (and the warning returns)
  await p.evaluate(() => { const S = window.__sbSync, t = JSON.parse(JSON.stringify(S.state.tasks.h3)); delete t.xc; S.state.tasks.h3 = t; S.render(); });
  g = await G("his"); ok(near(g.wAll, 110), "without the tick it's regular weight again: 110%");

  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(fails ? `grades-xc.e2e: ${fails} FAILED` : "grades-xc.e2e: all passed");
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
