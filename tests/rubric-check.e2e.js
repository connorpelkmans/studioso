// node tests/rubric-check.e2e.js
// Rubric Check (Pro, AI): the rubric fills itself in, a draft is checked per criterion (mocked Gemini), weak spots become steps with Undo;
// no key, AI errors and garbled replies, the locked path, phone width
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const RUBRIC = "Argumentative Essay Rubric (100 points)\n- Clear, arguable thesis in the introduction (20 points)\n- Uses at least 4 scholarly sources, cited in MLA (20 points)\n- Addresses a counterargument (20 points)\n- Organization and transitions between paragraphs (20 points)\n- Grammar, spelling and mechanics (20 points)\nSubmit as a PDF on Canvas.";
const DRAFT = `Cooling Cities With Parks

Every summer, cities get hotter than the countryside around them. In this essay I argue that urban green space is the cheapest and fastest way to cool a city, and that city councils should fund new parks before they fund new cooling centers.

Parks in Phoenix are about four degrees cooler than the blocks around them (Smith 2021). Shade from street trees also lowers the temperature of sidewalks, which matters for people who walk or wait for buses. When neighborhoods are cooler, people use less air conditioning, so their bills go down and the power grid is under less strain during heat waves.

Green space also helps in other ways. It soaks up rain, gives people a place to exercise and makes neighborhoods nicer to live in. Some cities have already started planting thousands of trees every year, and early results look good.

In conclusion, parks and trees are a smart investment. Cities should plant first and build later, because every new park makes the whole city a little cooler.`;
function SEED(){
  return {v: 2, updated: 1, settings: {}, courses: [{id: "c2", name: "Writing and Rhetoric", code: "ENG102", color: "#E0563B"}],
    tasks: [
      {id: "t1", title: "Argumentative essay: urban heat", courseId: "c2", type: "Assignment", due: day(6), start: day(0), status: "todo", priority: "high", notes: RUBRIC, checklist: [{id: "s1", text: "Find 2 more sources", done: false}], created: 5},
      {id: "t2", title: "Policy memo", courseId: "c2", type: "Assignment", due: day(9), start: day(1), status: "todo", priority: "med", notes: "", created: 6,
        cv: {id: "77", url: "https://canvas.example/courses/2/assignments/77", rub: {name: "Memo Rubric", pts: 30, cr: [{t: "Recommendation is stated first", d: "One sentence, in the opening paragraph", pts: 10, lv: []}, {t: "Evidence supports the recommendation", d: "", pts: 20, lv: []}]}}},
      {id: "t3", title: "Midterm", courseId: "c2", type: "Exam", due: day(12), status: "todo", priority: "med", created: 7},
      {id: "t4", title: "Reading response 3", courseId: "c2", type: "Assignment", due: day(-2), status: "done", priority: "med", created: 8}],
    notes: [], decks: [], files: [], events: []};
}
const textOf = body => { try { const out = []; const walk = v => { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(JSON.parse(body)); return out.join("\n"); } catch (e) { return String(body || ""); } };
const REPLY = {summary: "The thesis is clear and the organization works, but the essay needs more scholarly sources and never answers a counterargument.", criteria: [
  {n: 1, criterion: "Thesis", status: "Strong", evidence: "I argue that urban green space is the cheapest and fastest way to cool a city", suggestion: "Keep the thesis where it is; make sure each body paragraph ties back to it."},
  {n: 2, criterion: "Sources", status: "Weak", evidence: "Parks in Phoenix are about four degrees cooler than the blocks around them (Smith 2021).", suggestion: "Add at least three more peer-reviewed sources and a Works Cited page in MLA format."},
  {n: 3, criterion: "Counterargument", status: "Missing", evidence: "", suggestion: "Name the strongest objection, such as the water parks use, and answer it in its own paragraph."},
  {n: 4, criterion: "Organization", status: "OK", evidence: "Green space also helps in other ways.", suggestion: "Use transitions that say how each paragraph builds on the one before."},
  {n: 5, criterion: "Grammar", status: "Strong", evidence: "Every summer, cities get hotter than the countryside around them.", suggestion: "Proofread once more aloud before submitting."}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (o, viewport) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 900}, serviceWorkers: "block"});
    Object.assign(ctx, {bodies: [], mode: "ok"});
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const t = textOf(route.request().postData() || ""); ctx.bodies.push(t);
      if (ctx.mode === "500") return route.fulfill({status: 500, contentType: "application/json", body: JSON.stringify({error: {message: "Internal error"}})});
      const reply = ctx.mode === "bad" ? {summary: "Looks fine", criteria: [{criterion: "All", status: "Excellent"}]} : /review a student's draft against their assignment's rubric/.test(t) ? REPLY : {};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.route(/\/v1\/ai$/, route => route.fulfill({status: 500, body: "{}"}));
    await ctx.addInitScript(([seed, o]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
        if (o.key) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
        if (o.free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
    }, [SEED(), o]);
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy && window.SBRUBRIC);
    await page.waitForTimeout(700); return page;
  };
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  const task = (page, id) => page.evaluate(id => window.__sbProStudy.state().tasks[id], id);
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .rbx-item, .rbx-row")].every(x => x.scrollWidth <= x.clientWidth + 1)); });
  const btn = '#dlg[open] [data-act="rb-check"]';

  /* Pro with a key */
  const ctx = await mkCtx({key: true}), page = await open(ctx);
  await act(page, "edit-task", "t3"); await page.waitForSelector("#dlg[open] .sheet-foot");
  ok(await page.locator(btn).count() === 0, "no Check Against Rubric on an exam");
  await act(page, "edit-task", "t4"); await page.waitForSelector("#dlg[open] .sheet-foot");
  ok(await page.locator(btn).count() === 0, "or on an assignment that's done");
  await act(page, "edit-task", "t1"); await page.waitForSelector(btn);
  ok((await page.textContent(btn)).trim() === "Check Against Rubric", "an open assignment has Check Against Rubric in the task sheet's actions");
  ok(await fits(page), "the task sheet still fits at 1280px");
  await page.click(btn); await page.waitForSelector("#dlg[open] .rbx-sheet [data-rb-rub]");
  await page.waitForFunction(() => /Clear, arguable thesis/.test(document.querySelector("[data-rb-rub]").value));
  ok(/From this task's notes/.test(await page.textContent("[data-rb-rubsrc]")) && (await page.textContent("[data-rb-cr]")).trim() === "5 criteria found", "the rubric fills in from the task's notes: 5 criteria (the heading isn't one)");
  ok(/sent only to Google \(Gemini\), with your own AI key/.test(await page.textContent("#dlg[open] .rbx-priv")), "it says the draft goes only to the student's own AI provider");
  ok(/never writes or rewrites your work/.test(await page.textContent("#dlg[open] .sheet-body")), "and that it never writes the student's work");
  await page.click("[data-rb-go]"); await page.waitForSelector(".rbx-err");
  ok(/Add your draft first/.test(await page.textContent(".rbx-err")) && ctx.bodies.length === 0, "no draft: it asks for one and sends nothing");
  await page.fill("[data-rb-draft]", DRAFT);
  await page.click("[data-rb-go]"); await page.waitForSelector("#dlg[open] .rbx-list .rbx-item");
  const sent = ctx.bodies[ctx.bodies.length - 1];
  ok(/Cooling Cities With Parks/.test(sent) && /1\. Clear, arguable thesis in the introduction \(20 points\)/.test(sent) && /5\. Grammar, spelling and mechanics/.test(sent), "the prompt has the draft and the numbered criteria with points");
  ok(/Never write, rewrite, complete or paraphrase/.test(sent) && /feedback only/.test(sent), "the system prompt forbids writing the student's work");
  const items = await page.$$eval("#dlg[open] .rbx-item", x => x.map(e => ({st: e.querySelector(".rbx-st").textContent, t: e.querySelector("b").textContent, q: (e.querySelector(".rbx-q") || {}).textContent || "", tip: (e.querySelector(".rbx-tip") || {}).textContent || ""})));
  ok(items.length === 5 && items.map(x => x.st).join() === "Strong,Weak,Missing,OK,Strong", "one result per criterion: " + items.map(x => x.st).join());
  ok(items[0].t === "Clear, arguable thesis in the introduction" && /From your draft: “I argue that urban green space/.test(items[0].q), "with the rubric's wording and a quote from the draft");
  ok(items[2].q === "Not found in your draft." && /Name the strongest objection/.test(items[2].tip), "a missing criterion has no quote and one suggestion");
  ok(/needs more scholarly sources/.test(await page.textContent("#dlg[open] .rbx-sum")), "a short summary on top");
  ok(await fits(page), "the results fit at 1280px");
  const save = "#dlg[open] [data-rb-save]";
  ok((await page.textContent(save)).trim() === "Add 2 Steps to This Task", "Weak and Missing can be added as steps");
  await page.click(save); await page.waitForTimeout(300);
  let t1 = await task(page, "t1");
  ok(t1.checklist.length === 3 && /^Uses at least 4 scholarly sources, cited in MLA: Add at least three more/.test(t1.checklist[1].text) && /^Addresses a counterargument: /.test(t1.checklist[2].text) && t1.checklist[0].text === "Find 2 more sources", "the steps are added after the task's own");
  ok((await page.textContent(save)).trim() === "Added 2 Steps" && await page.isDisabled(save), "the button says they were added");
  await page.click("#toastUndo"); await page.waitForTimeout(300);
  t1 = await task(page, "t1");
  ok(t1.checklist.length === 1, "Undo takes the steps back off");

  /* Upload a draft; garbled reply; AI error */
  await page.click("#dlg[open] [data-rb-back]"); await page.waitForSelector("[data-rb-draftfile]", {state: "attached"});
  await page.setInputFiles("[data-rb-draftfile]", {name: "essay-draft-2.txt", mimeType: "text/plain", buffer: Buffer.from(DRAFT.replace("Cooling Cities", "Cooler Cities"))});
  await page.waitForFunction(() => /Cooler Cities/.test(document.querySelector("[data-rb-draft]").value));
  ok(/From essay-draft-2\.txt/.test(await page.textContent("[data-rb-draftsrc]")), "an uploaded text file fills the draft");
  ctx.mode = "bad"; await page.click("[data-rb-go]"); await page.waitForSelector(".rbx-err");
  ok(/didn't make sense/.test(await page.textContent(".rbx-err")) && await page.locator("[data-rb-draft]").count() === 1, "a garbled reply says so and keeps what was entered");
  ctx.mode = "500"; await page.click("[data-rb-go]"); await page.waitForFunction(() => { const e = document.querySelector(".rbx-err"); return e && /busy/.test(e.textContent); }, null, {timeout: 30000});
  ok(true, "an AI error shows the AI's message: " + await page.textContent(".rbx-err"));
  ok(page.errs.length === 0, "no console errors (Pro): " + page.errs.join(" | "));

  /* A rubric from the school site */
  await act(page, "rb-check", "t2"); await page.waitForFunction(() => { const r = document.querySelector("[data-rb-rub]"); return r && /Recommendation is stated first \(10 points\)/.test(r.value); });
  ok(/school site/.test(await page.textContent("[data-rb-rubsrc]")), "a Canvas rubric fills the rubric in");
  await ctx.close();

  /* Phone */
  const pctx = await mkCtx({key: true}, {width: 390, height: 844}), pp = await open(pctx);
  await act(pp, "edit-task", "t1"); await pp.waitForSelector(btn);
  ok(await fits(pp), "the task sheet with the button fits at 390px");
  await pp.click(btn); await pp.waitForFunction(() => /Clear, arguable/.test((document.querySelector("[data-rb-rub]") || {}).value || ""));
  ok(await fits(pp), "the form fits at 390px");
  await pp.fill("[data-rb-draft]", DRAFT); await pp.click("[data-rb-go]"); await pp.waitForSelector("#dlg[open] .rbx-item");
  ok(await fits(pp), "the results fit at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();

  /* No key */
  const nctx = await mkCtx({key: false}), np = await open(nctx);
  await act(np, "edit-task", "t1"); await np.waitForSelector(btn); await np.click(btn);
  await np.waitForSelector("#dlg[open] [data-rb-setup]");
  ok(/uses AI with your own key/.test(await np.textContent("#dlg[open] .sheet-body")) && nctx.bodies.length === 0, "without a key it explains and offers Set Up AI, sending nothing");
  await np.click("#dlg[open] [data-rb-setup]"); await np.waitForTimeout(300);
  ok(await np.locator('#dlg[open] [data-key="gemini"]').count() === 1, "Set Up AI opens the AI setup");
  ok(np.errs.length === 0, "no console errors (no key): " + np.errs.join(" | "));
  await nctx.close();

  /* Free (locked) */
  const fctx = await mkCtx({key: true, free: true}), fp = await open(fctx);
  await act(fp, "edit-task", "t1"); await fp.waitForSelector(btn);
  ok(await fp.locator(btn + " .pro-badge").count() === 1, "free users see it with a PRO badge");
  await fp.click(btn); await fp.waitForTimeout(400);
  ok(/Rubric Check is part of Studyboard Pro/.test(await fp.textContent("#dlg[open]")) && await fp.locator(".rbx-sheet").count() === 0 && fctx.bodies.length === 0, "and it opens the Pro sheet instead");
  ok(fp.errs.length === 0, "no console errors (free): " + fp.errs.join(" | "));
  await fctx.close();

  await browser.close(); server.close();
  console.log(`\nrubric-check e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
