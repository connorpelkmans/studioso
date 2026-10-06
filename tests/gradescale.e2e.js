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
  const mk = async ({ai, reply, w = 1280, settings, grounding} = {}) => {
    const ctx = await browser.newContext({viewport: {width: w, height: w < 500 ? 780 : 900}});
    await ctx.addInitScript(([seed, ai]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {} }, [SEED(settings), !!ai]);
    ctx.calls = 0; ctx.bodies = []; ctx.reply = reply; ctx.grounding = grounding;
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.calls++; try { ctx.bodies.push(route.request().postDataJSON()); } catch (e) {}
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
      const c = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).courses[0].grading);
      ok(c && c.pass === 55 && c.scale && c.scale[0][1] === 93, "saving stores the pass mark and the edited scale: " + JSON.stringify(c && [c.pass, c.scale && c.scale[0]]));
      await ctx.close(); }

    // ---- the school lookup: found from the connected learning site, by web search ----
    const LMS = {brightspace: {host: "learn.testu.ca", mode: "api", name: ""}}, MANUAL = {ai: {auto: false}};
    const SCALE8 = [["A+", 90], ["A", 85], ["A-", 80], ["B+", 76], ["B", 72], ["C", 60], ["D", 50], ["F", 0]].map(([letter, min]) => ({letter, min}));
    const FOUND = (o) => Object.assign({found: true, school: "Test University", scale: SCALE8, pass: 55, sourceUrl: "https://registrar.testu.ca/grades", note: ""}, o || {});
    const GROUND = t => [{web: {uri: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc", title: t}}];
    { // on demand, the school's own site
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND(), grounding: GROUND("registrar.testu.ca")});
      await openSettings(page);
      ok(/learn\.testu\.ca/.test(await page.textContent("#gsSchool")) && await page.locator("#gsFind").count() === 1, "the connected learning site is recognised");
      ok(ctx.calls === 0, "nothing is searched until it is asked for (Automatic AI is off here)");
      await page.click("#gsFind"); await page.waitForFunction(() => /own website/.test(document.querySelector("#gsSchool").textContent));
      ok(JSON.stringify(await rows(page)) === JSON.stringify(SCALE8.map(x => [x.letter, String(x.min)])), "the scale boxes are filled in");
      ok(await page.inputValue('input[name="pass"]') === "55", "the pass mark is filled in too");
      const body = ctx.bodies[0], txt = JSON.stringify(body);
      ok(body.tools && body.tools[0].google_search && !body.generationConfig.responseMimeType, "it asks Google to search the web");
      ok(/learn\.testu\.ca/.test(txt) && !/Biology|BIO1/.test(txt), "only the site address is sent, nothing about the student's courses");
      await page.click('[data-submit]'); await page.waitForTimeout(250);
      const gr = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).courses[0].grading); ok(gr.pass === 55 && gr.scale.length === 8, "saving keeps what was found");
      await ctx.close(); }
    { // a page that is not the school's own: filled in, with a warning
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({sourceUrl: "https://randomsite.com/scale"}), grounding: GROUND("randomsite.com")});
      await openSettings(page); await page.click("#gsFind"); await page.waitForFunction(() => /isn't the school's own website/.test(document.querySelector("#gsSchool").textContent));
      ok((await rows(page)).length === 8, "an unofficial source still fills the boxes, with a warning to check"); await ctx.close(); }
    for (const [what, reply, grounding] of [["a page the search never used", FOUND(), GROUND("someothersite.org")], ["nothing grounded at all", FOUND(), undefined], ["found: false", {found: false, scale: []}, GROUND("registrar.testu.ca")], ["too few letters", FOUND({scale: SCALE8.slice(0, 2)}), GROUND("registrar.testu.ca")]]) {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply, grounding});
      await openSettings(page); const before = JSON.stringify(await rows(page)); await page.click("#gsFind"); await page.waitForFunction(() => /Upload a screenshot or paste/.test(document.querySelector("#gsMsg").textContent));
      ok(JSON.stringify(await rows(page)) === before && await page.evaluate(() => !document.querySelector("#gsPasteBox").hidden), `${what}: nothing is filled in, and the screenshot / paste box opens`); await ctx.close(); }
    { // no AI set up
      const {ctx, page} = await mk({settings: Object.assign({}, LMS)}); await openSettings(page); await page.click("#gsFind");
      ok(/needs AI/.test(await msg(page)) && ctx.calls === 0, "without AI it says so and offers upload / paste"); await ctx.close(); }
    { // automatic: official source fills in everything for all courses, once, with an Undo
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS), reply: FOUND(), grounding: GROUND("registrar.testu.ca")});
      await page.evaluate(() => window.__sbGrades.schoolAuto()); await page.waitForTimeout(400);
      let g = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).settings.grades || {});
      ok(g.pass === 55 && g.scale && g.scale.length === 8 && g.school && g.school.host === "registrar.testu.ca" && g.school.official, "automatic: the school's scale and pass mark are filled in for all courses");
      ok(/Test University's grade scale and 55% pass mark/.test(await page.evaluate(() => document.querySelector("#toast").textContent)), "and a note says so");
      await page.evaluate(() => window.__sbGrades.schoolAuto()); ok(ctx.calls === 1, "the same school is not searched again");
      await page.click("#toastUndo"); await page.waitForTimeout(250);
      g = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).settings.grades || {}); ok(!g.scale && !g.school && (g.pass == null || g.pass === 50), "Undo puts the old scale and pass mark back: " + JSON.stringify(g));
      await ctx.close(); }
    { // automatic but not the school's own page: a suggestion to check, never filled in silently
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS), reply: FOUND({sourceUrl: "https://randomsite.com/s"}), grounding: GROUND("randomsite.com")});
      await page.evaluate(() => window.__sbGrades.schoolAuto()); await page.waitForTimeout(400);
      const g = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).settings.grades || {}); ok(!g.scale && g.suggest && g.suggest.host === "randomsite.com", "automatic, unofficial: kept as a suggestion only");
      await openSettings(page); ok(/Is this your school/.test(await page.textContent("#gsSchool")), "the suggestion is asked about in Grade Settings");
      await page.click("#gsSugYes"); ok((await rows(page)).length === 8 && await page.inputValue('input[name="pass"]') === "55", "Use It fills the boxes");
      await ctx.close(); }
    { // no learning site connected: type the school's name
      const {ctx, page} = await mk({ai: true, settings: MANUAL, reply: FOUND(), grounding: GROUND("registrar.testu.ca")});
      await openSettings(page); await page.click("#gsFind"); ok(/Type your school's name/.test(await msg(page)) && ctx.calls === 0, "asks for the school's name when no site is connected");
      await page.fill("#gsSchoolName", "Test University"); await page.click("#gsFind"); await page.waitForFunction(() => /Found/.test(document.querySelector("#gsSchool").textContent));
      ok(/Test University/.test(JSON.stringify(ctx.bodies[0])), "the typed name is what is searched"); ok((await rows(page)).length === 8, "and the boxes fill in"); await ctx.close(); }
    { const {ctx, page} = await mk({});
      const t = await page.evaluate(() => { const G = window.__sbGrades; return {a: G.baseDomain("learn.example.edu"), b: G.baseDomain("moodle.abc.ac.uk"), c: G.baseDomain("x.edu"), v: G.vetSchool({data: {found: true, school: "S", scale: [{letter: "A", min: 90}, {letter: "B", min: 80}, {letter: "C", min: 70}], pass: 50, sourceUrl: "https://registrar.testu.ca/x"}, sources: [{url: "https://vertexaisearch.cloud.google.com/r", title: "testu.ca"}]}, "x.instructure.com"), n: G.vetSchool({data: {found: true, scale: [{letter: "A", min: 90}, {letter: "B", min: 80}, {letter: "C", min: 70}], sourceUrl: "https://registrar.testu.ca/x"}}, "learn.testu.ca")}; });
      ok(t.a === "example.edu" && t.b === "abc.ac.uk" && t.c === "x.edu", "school domain: " + [t.a, t.b, t.c]);
      ok(t.v && t.v.official === false && t.n === null, "a vendor-hosted site can't prove a source is official; no sources at all means no result"); await ctx.close(); }
    // parser and cleaner
    { const {ctx, page} = await mk({});
      const t = await page.evaluate(() => { const G = window.__sbGrades; return {a: G.parseScale("A+ 90-100%\nA: 85\nB = 80 to 84\nnonsense\nC 100-70"), b: G.cleanScale([{letter: "a +", min: 90}, {letter: "A+", min: 88}, {letter: "B", min: 500}, {letter: "C", min: 70}], null), c: G.cleanScale([{letter: "A", min: 90}, {letter: "B", min: 80}], "A 90-100\nB 85-89")}; });
      ok(JSON.stringify(t.a) === JSON.stringify([["A+", 90], ["A", 85], ["B", 80], ["C", 70]]), "plain reader: lower end of ranges: " + JSON.stringify(t.a));
      ok(JSON.stringify(t.b) === JSON.stringify([["A+", 90], ["C", 70]]), "cleaner drops bad letters, repeats and out of range: " + JSON.stringify(t.b));
      ok(t.c === null, "cleaner drops numbers that are not in the text (leaving too few)");
      await ctx.close(); }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
