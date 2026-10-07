// node tests/gradescale.e2e.js  (Playwright + Chromium; the AI network call is stubbed)
// Grade Settings: no school-specific wording, a default pass mark of 50, one box per letter and per percent, and a letter scale read from a screenshot or pasted text.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SEED = extra => ({v: 2, courses: [{id: "c1", name: "Biology", code: "BIO1", color: "#3B6FE0"}], settings: Object.assign({capacity: 15, dailyHours: 3}, extra || {}), updated: 1, tasks: []});
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch();
  const mk = async ({ai, reply, w = 1280, settings, grounding, limitSearch} = {}) => {
    const ctx = await browser.newContext({viewport: {width: w, height: w < 500 ? 780 : 900}});
    await ctx.addInitScript(([seed, ai]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {} }, [SEED(settings), !!ai]);
    ctx.calls = 0; ctx.bodies = []; ctx.reply = reply; ctx.grounding = grounding; ctx.limitSearch = limitSearch;
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.calls++; try { ctx.bodies.push(route.request().postDataJSON()); } catch (e) {}
      if (ctx.limitAll || (ctx.limitSearch && ctx.bodies[ctx.bodies.length - 1] && ctx.bodies[ctx.bodies.length - 1].tools)) { route.fulfill({status: 429, contentType: "application/json", body: JSON.stringify({error: {message: "Quota exceeded for grounding"}})}); return; }
      const cand = {content: {parts: [{text: JSON.stringify(ctx.reply || {scale: []})}]}, finishReason: "STOP"}; if (ctx.grounding) cand.groundingMetadata = {groundingChunks: ctx.grounding};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [cand]})}); });
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbGrades);
    return {ctx, page};
  };
  const openSettings = async page => { await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "g-course-set"; b.dataset.id = "c1"; b.id = "tmpGs"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForSelector("#gsRows"); };
  const rows = page => page.$$eval("#gsRows .gr-scale-row", rs => rs.map(r => [r.querySelector('[name="sl"]').value, r.querySelector('[name="sp"]').value]));
  const msg = page => page.textContent("#gsMsg");
  try {
    for (const W of [1280, 390]) {
      console.log("\n=== width", W);
      let {ctx, page} = await mk({w: W});
      await openSettings(page);
      const html = await page.evaluate(() => document.querySelector("#dlg").innerHTML);
      ok(!/bcit/i.test(html) && !/bcit/i.test(await page.evaluate(() => document.body.innerHTML)), "no school-specific wording on the page");
      ok(!(await page.$("#gsReset")), "the BCIT default button is gone");
      ok(await page.inputValue('input[name="pass"]') === "50", "the default pass mark is 50");
      const r0 = await rows(page); ok(r0.length >= 10 && r0.every(r => r[0] && r[1] !== ""), "one box per letter and per percent: " + r0.length + " rows");
      ok(await page.locator("#gsFile").count() === 1 && await page.locator("#gsPasteBtn").count() === 1, "upload and paste buttons are there");
      // editing: change a percent, add a letter, remove a letter, save
      await page.fill('#gsRows .gr-scale-row:nth-child(1) input[name="sp"]', "92");
      await page.click("#gsAdd"); await page.fill('#gsRows .gr-scale-row:last-child input[name="sl"]', "e"); await page.fill('#gsRows .gr-scale-row:last-child input[name="sp"]', "40");
      await page.click('#gsRows .gr-scale-row:nth-child(2) .gr-scale-del');
      ok((await rows(page)).length === r0.length, "add and remove a letter");
      await page.click("[data-submit]"); await page.waitForTimeout(250);
      await ctx.close();
      ({ctx, page} = await mk({w: W}));
      await openSettings(page);
      // no AI: pasted text is read plainly, ranges count by their lower end; a screenshot says it needs AI
      await page.click("#gsPasteBtn"); await page.fill("#gsPaste", "A 85-89\nB 70-74\nC 60 - 64\nD 50-59\nF 0-49"); await page.click("#gsPasteGo"); await page.waitForTimeout(200);
      let r = await rows(page); ok(JSON.stringify(r) === JSON.stringify([["A", "85"], ["B", "70"], ["C", "60"], ["D", "50"], ["F", "0"]]), "pasted text without AI: " + JSON.stringify(r));
      ok(/Read without AI/.test(await msg(page)), "says it was read without AI: " + await msg(page));
      await page.setInputFiles("#gsFile", {name: "scale.png", mimeType: "image/png", buffer: PNG}); await page.waitForTimeout(200);
      ok(/needs AI/.test(await msg(page)) && ctx.calls === 0, "a screenshot needs AI and sends nothing without it");
      await page.fill("#gsPaste", "nothing useful"); await page.click("#gsPasteGo"); await page.waitForTimeout(150);
      ok(/Couldn't find letters/.test(await msg(page)), "gibberish gets a calm message");
      await ctx.close();
      // with AI: screenshot upload, pasted image, pasted text
      ({ctx, page} = await mk({ai: true, w: W, reply: {scale: [{letter: "A+", min: 95}, {letter: "A", min: 90}, {letter: "B", min: 80}, {letter: "C", min: 70}, {letter: "F", min: 0}]}}));
      await openSettings(page);
      await page.setInputFiles("#gsFile", {name: "scale.png", mimeType: "image/png", buffer: PNG}); await page.waitForFunction(() => /Filled in/.test(document.querySelector("#gsMsg").textContent));
      r = await rows(page); ok(JSON.stringify(r) === JSON.stringify([["A+", "95"], ["A", "90"], ["B", "80"], ["C", "70"], ["F", "0"]]) && ctx.calls === 1, "screenshot read by AI fills the boxes: " + JSON.stringify(r));
      ok(/Filled in 5 letters/.test(await msg(page)) && !/without AI/.test(await msg(page)), "says how many were filled: " + await msg(page));
      // paste an image straight into the sheet
      ctx.reply = {scale: [{letter: "P", min: 60}, {letter: "F", min: 0}]};
      await page.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], "shot.png", {type: "image/png"})); document.querySelector("#dlg").dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true})); });
      await page.waitForFunction(() => /Filled in 2 letters/.test(document.querySelector("#gsMsg").textContent)); r = await rows(page);
      ok(JSON.stringify(r) === JSON.stringify([["P", "60"], ["F", "0"]]), "a pasted screenshot is read too: " + JSON.stringify(r));
      // pasted text through AI: numbers not in the text are dropped (falls back to the plain reader)
      ctx.reply = {scale: [{letter: "A", min: 77}, {letter: "B", min: 66}]};
      await page.click("#gsPasteBtn"); await page.fill("#gsPaste", "A 85-89\nB 70-74"); await page.click("#gsPasteGo"); await page.waitForTimeout(300);
      r = await rows(page); ok(JSON.stringify(r) === JSON.stringify([["A", "85"], ["B", "70"]]), "invented numbers are thrown away, the text's own are used: " + JSON.stringify(r));
      ok(page.errs.length === 0, "no page errors " + page.errs.join(";"));
      // validation on save
      await page.fill('#gsRows .gr-scale-row:nth-child(2) input[name="sl"]', "A"); await page.click("[data-submit]"); await page.waitForTimeout(150);
      ok(/twice/.test(await page.evaluate(() => document.querySelector("#toast").textContent)), "a repeated letter is refused");
      await ctx.close();
    }
    // saved scale and pass mark reach the course
    { const {ctx, page} = await mk({}); await openSettings(page);
      await page.fill('input[name="pass"]', "55"); await page.fill('#gsRows .gr-scale-row:nth-child(1) input[name="sp"]', "93"); await page.click("[data-submit]"); await page.waitForTimeout(250);
      const sv = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("coursework:v2")); return {c: d.courses[0].grading, g: (d.settings || {}).grades || {}}; });
      ok(sv.c && sv.c.pass === 55 && sv.g.scale && sv.g.scale[0][1] === 93, "saving stores the pass mark on the course and the edited scale for all courses (the default): " + JSON.stringify([sv.c && sv.c.pass, sv.g.scale && sv.g.scale[0]]));
      await ctx.close(); }

    // ---- the school lookup: the AI answers from what it knows (no web search); always offered for checking ----
    const LMS = {brightspace: {host: "learn.testu.ca", mode: "api", name: ""}}, MANUAL = {ai: {auto: false}};
    const SCALE8 = [["A+", 90], ["A", 85], ["A-", 80], ["B+", 76], ["B", 72], ["C", 60], ["D", 50], ["F", 0]].map(([letter, min]) => ({letter, min}));
    const FOUND = (o) => Object.assign({found: true, school: "Test University", scale: SCALE8, pass: 55, note: ""}, o || {});
    { // on demand, from the connected learning site
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND()});
      await openSettings(page);
      ok(/learn\.testu\.ca/.test(await page.textContent("#gsSchool")) && await page.locator("#gsFind").count() === 1, "the connected learning site is recognised");
      ok(ctx.calls === 0, "nothing is asked until the button is pressed, and nothing runs in the background");
      await page.click("#gsFind"); await page.waitForFunction(() => /hasn't been checked online/.test(document.querySelector("#gsSchool").textContent));
      ok(JSON.stringify(await rows(page)) === JSON.stringify(SCALE8.map(x => [x.letter, String(x.min)])), "the scale boxes are filled in");
      ok(await page.inputValue('input[name="pass"]') === "55", "the pass mark is filled in too");
      ok(await page.locator('input[name="all"]').isChecked(), "Use This Scale for All My Courses is ticked");
      const body = ctx.bodies[0], txt = JSON.stringify(body);
      ok(!body.tools, "no web search is requested");
      ok(/learn\.testu\.ca/.test(txt) && !/Biology|BIO1/.test(txt), "only the site address is sent, nothing about the student's courses");
      await page.click('[data-submit]'); await page.waitForFunction(() => { try { return ((JSON.parse(localStorage.getItem("coursework:v2")).settings || {}).grades || {}).pass === 55; } catch (e) { return false; } }, null, {timeout: 5000}).catch(() => {});
      const gr = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("coursework:v2")); return {pass: ((d.settings || {}).grades || {}).pass, scale: ((d.settings || {}).grades || {}).scale}; }); ok(gr.pass === 55 && gr.scale && gr.scale.length === 8, "saving keeps what was found, for all courses: " + JSON.stringify(gr));
      await ctx.close(); }
    for (const [what, reply] of [["found: false", {found: false, scale: []}], ["too few letters", FOUND({scale: SCALE8.slice(0, 2)})]]) {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply});
      await openSettings(page); const before = JSON.stringify(await rows(page)); await page.click("#gsFind"); await page.waitForFunction(() => /Upload a screenshot or paste/.test(document.querySelector("#gsMsg").textContent));
      ok(JSON.stringify(await rows(page)) === before && await page.evaluate(() => !document.querySelector("#gsPasteBox").hidden), `${what}: nothing is filled in, and the screenshot / paste box opens`); await ctx.close(); }
    { // no AI set up
      const {ctx, page} = await mk({settings: Object.assign({}, LMS)}); await openSettings(page); await page.click("#gsFind");
      ok(/needs AI/.test(await msg(page)) && ctx.calls === 0, "without AI it says so and offers upload / paste"); await ctx.close(); }
    { // no learning site connected: type the school's name
      const {ctx, page} = await mk({ai: true, settings: MANUAL, reply: FOUND()});
      await openSettings(page); await page.click("#gsFind"); ok(/Type your school's name/.test(await msg(page)) && ctx.calls === 0, "asks for the school's name when no site is connected");
      await page.fill("#gsSchoolName", "Test University"); await page.click("#gsFind"); await page.waitForFunction(() => /best knowledge/.test(document.querySelector("#gsSchool").textContent));
      ok(/Test University/.test(JSON.stringify(ctx.bodies[0])), "the typed name is what is asked about"); ok((await rows(page)).length === 8, "and the boxes fill in"); await ctx.close(); }
    { // a program with its own scale: asked about, flagged as that program's
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({scope: "program", program: "Nursing"})});
      await openSettings(page); ok(await page.locator("#gsProgram").count() === 1, "there is a program box");
      await page.fill("#gsProgram", "Nursing"); await page.click("#gsFind"); await page.waitForFunction(() => /the Nursing scale at Test University/.test(document.querySelector("#gsSchool").textContent));
      ok(/program: Nursing/.test(JSON.stringify(ctx.bodies[0])), "the program is sent with the school");
      ok(await page.inputValue("#gsProgram") === "Nursing", "the program box keeps what was typed");
      ok((await rows(page)).length === 8, "and the program's scale fills in"); await ctx.close(); }
    { // no separate program scale: the school's general scale is used, and it says so
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({scope: "school"})});
      await openSettings(page); await page.fill("#gsProgram", "Geology"); await page.click("#gsFind");
      await page.waitForFunction(() => /general scale \(no separate Geology scale found\)/.test(document.querySelector("#gsSchool").textContent));
      ok((await rows(page)).length === 8, "falls back to the school's scale"); await ctx.close(); }
    { // the program starts as the major from Area of Study
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL, {area: {id: "health", text: "Nursing"}}), reply: FOUND()});
      await openSettings(page); ok(await page.inputValue("#gsProgram") === "Nursing", "prefilled from the area of study"); await ctx.close(); }
    { // a rate limit shows Google's own words
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND(), limitSearch: true});
      ctx.limitAll = true; await openSettings(page); await page.click("#gsFind"); await page.waitForFunction(() => /Google said/.test(document.querySelector("#gsMsg").textContent));
      ok(/Quota exceeded/.test(await msg(page)), "the rate-limit message includes what Google said"); await ctx.close(); }
    { const {ctx, page} = await mk({});
      await openSettings(page); await page.fill('#gsRows .gr-scale-row:nth-child(1) input[name="sl"]', "Z"); await page.click("#gsStd");
      ok((await rows(page))[0][0] === "A+" && /standard scale/.test(await msg(page)), "Reset to a standard scale brings the boxes back");
      await page.click("[data-submit]"); await page.waitForTimeout(250);
      const c = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).courses[0].grading);
      ok(c.pass === null, "a course saved with the default pass mark keeps following the default (not pinned): " + JSON.stringify(c.pass));
      await ctx.close(); }
    { const {ctx, page} = await mk({});
      const t = await page.evaluate(() => { const G = window.__sbGrades, S = [{letter: "A", min: 90}, {letter: "B", min: 80}, {letter: "C", min: 70}, {letter: "D", min: 50}]; return {ok: G.vetSchool({data: {found: true, school: "Test U", scale: S, pass: 50}}), few: G.vetSchool({data: {found: true, scale: S.slice(0, 2)}}), no: G.vetSchool({data: {found: false}}), badPass: G.vetSchool({data: {found: true, scale: S, pass: 500}})}; });
      ok(t.ok && t.ok.official === false && t.ok.recalled && t.ok.pass === 50, "a complete scale is accepted but never marked official");
      ok(t.few === null && t.no === null, "a short scale or found: false gives nothing");
      ok(t.badPass && t.badPass.pass === null, "an impossible pass mark is dropped"); await ctx.close(); }
    // parser and cleaner
    { const {ctx, page} = await mk({});
      const t = await page.evaluate(() => { const G = window.__sbGrades; return {a: G.parseScale("A+ 90-100%\nA: 85\nB = 80 to 84\nnonsense\nC 100-70"), b: G.cleanScale([{letter: "a +", min: 90}, {letter: "A+", min: 88}, {letter: "B", min: 500}, {letter: "C", min: 70}], null), c: G.cleanScale([{letter: "A", min: 90}, {letter: "B", min: 80}], "A 90-100\nB 85-89")}; });
      ok(JSON.stringify(t.a) === JSON.stringify([["A+", 90], ["A", 85], ["B", 80], ["C", 70]]), "plain reader: lower end of ranges: " + JSON.stringify(t.a));
      const t2 = await page.evaluate(() => window.__sbGrades.parseScale("A  4.0  85-89\nB 3.0 80\nC 70%\nD 60 to 69\nF below 50\nGrade scale:"));
      ok(JSON.stringify(t2) === JSON.stringify([["A", 85], ["B", 80], ["C", 70], ["D", 60], ["F", 0]]), "plain reader skips GPA columns, reads a % sign, and \"below 50\" means the letter starts at 0: " + JSON.stringify(t2));
      ok(JSON.stringify(t.b) === JSON.stringify([["A+", 90], ["C", 70]]), "cleaner drops bad letters, repeats and out of range: " + JSON.stringify(t.b));
      ok(t.c === null, "cleaner drops numbers that are not in the text (leaving too few)");
      await ctx.close(); }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
