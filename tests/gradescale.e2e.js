// node tests/gradescale.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
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
  const browser = await chromium.launch({executablePath});
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
      ok(await page.inputValue('input[name="pass"]') === "60", "the default pass mark follows the default scale (60, a D-, on the US scale for en-US)");
      ok(await page.inputValue('#gsRows .gr-scale-row:nth-child(1) input[name="sp"]') === "97" && await page.inputValue('#gsRows .gr-scale-row:nth-child(3) input[name="sp"]') === "90", "the default for en-US is the US 10-point scale (A+ 97, A- 90)");
      const r0 = await rows(page); ok(r0.length >= 10 && r0.every(r => r[0] && r[1] !== ""), "one box per letter and per percent: " + r0.length + " rows");
      ok(await page.locator("#gsFile").count() === 1 && await page.locator("#gsPasteBtn").count() === 1, "upload and paste buttons are there");
      await page.fill('#gsRows .gr-scale-row:nth-child(1) input[name="sp"]', "92");
      await page.click("#gsAdd"); await page.fill('#gsRows .gr-scale-row:last-child input[name="sl"]', "e"); await page.fill('#gsRows .gr-scale-row:last-child input[name="sp"]', "40");
      await page.click('#gsRows .gr-scale-row:nth-child(2) .gr-scale-del');
      ok((await rows(page)).length === r0.length, "add and remove a letter");
      await page.click("[data-submit]"); await page.waitForTimeout(250);
      await ctx.close();
      ({ctx, page} = await mk({w: W}));
      await openSettings(page);
      await page.click("#gsPasteBtn"); await page.fill("#gsPaste", "A 85-89\nB 70-74\nC 60 - 64\nD 50-59\nF 0-49"); await page.click("#gsPasteGo"); await page.waitForTimeout(200);
      let r = await rows(page); ok(JSON.stringify(r) === JSON.stringify([["A", "85"], ["B", "70"], ["C", "60"], ["D", "50"], ["F", "0"]]), "pasted text without AI: " + JSON.stringify(r));
      ok(/Read without AI/.test(await msg(page)), "says it was read without AI: " + await msg(page));
      await page.setInputFiles("#gsFile", {name: "scale.png", mimeType: "image/png", buffer: PNG}); await page.waitForTimeout(200);
      ok(/needs AI/.test(await msg(page)) && ctx.calls === 0, "a screenshot needs AI and sends nothing without it");
      await page.fill("#gsPaste", "nothing useful"); await page.click("#gsPasteGo"); await page.waitForTimeout(150);
      ok(/Couldn't find letters/.test(await msg(page)), "gibberish gets a calm message");
      await ctx.close();
      ({ctx, page} = await mk({ai: true, w: W, reply: {scale: [{letter: "A+", min: 95}, {letter: "A", min: 90}, {letter: "B", min: 80}, {letter: "C", min: 70}, {letter: "F", min: 0}]}}));
      await openSettings(page);
      await page.setInputFiles("#gsFile", {name: "scale.png", mimeType: "image/png", buffer: PNG}); await page.waitForFunction(() => /Filled in/.test(document.querySelector("#gsMsg").textContent));
      r = await rows(page); ok(JSON.stringify(r) === JSON.stringify([["A+", "95"], ["A", "90"], ["B", "80"], ["C", "70"], ["F", "0"]]) && ctx.calls === 1, "screenshot read by AI fills the boxes: " + JSON.stringify(r));
      ok(/Filled in 5 letters/.test(await msg(page)) && !/without AI/.test(await msg(page)), "says how many were filled: " + await msg(page));
      ctx.reply = {scale: [{letter: "P", min: 60}, {letter: "F", min: 0}]};
      await page.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], "shot.png", {type: "image/png"})); document.querySelector("#dlg").dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true})); });
      await page.waitForFunction(() => /Filled in 2 letters/.test(document.querySelector("#gsMsg").textContent)); r = await rows(page);
      ok(JSON.stringify(r) === JSON.stringify([["P", "60"], ["F", "0"]]), "a pasted screenshot is read too: " + JSON.stringify(r));
      ctx.reply = {scale: [{letter: "A", min: 77}, {letter: "B", min: 66}]};
      await page.click("#gsPasteBtn"); await page.fill("#gsPaste", "A 85-89\nB 70-74"); await page.click("#gsPasteGo"); await page.waitForTimeout(300);
      r = await rows(page); ok(JSON.stringify(r) === JSON.stringify([["A", "85"], ["B", "70"]]), "invented numbers are thrown away, the text's own are used: " + JSON.stringify(r));
      ok(page.errs.length === 0, "no page errors " + page.errs.join(";"));
      await page.fill('#gsRows .gr-scale-row:nth-child(2) input[name="sl"]', "A"); await page.click("[data-submit]"); await page.waitForTimeout(150);
      ok(/twice/.test(await page.evaluate(() => document.querySelector("#toast").textContent)), "a repeated letter is refused");
      await ctx.close();
    }
    { const {ctx, page} = await mk({}); await openSettings(page);
      await page.fill('input[name="pass"]', "55"); await page.fill('#gsRows .gr-scale-row:nth-child(1) input[name="sp"]', "93"); await page.click("[data-submit]"); await page.waitForTimeout(250);
      const sv = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("coursework:v2")); return {c: d.courses[0].grading, g: (d.settings || {}).grades || {}}; });
      ok(sv.c && sv.c.pass === 55 && sv.g.scale && sv.g.scale[0][1] === 93, "saving stores the pass mark on the course and the edited scale for all courses (the default): " + JSON.stringify([sv.c && sv.c.pass, sv.g.scale && sv.g.scale[0]]));
      await ctx.close(); }

    // the school and program lookup lives in Grade Options (top of the Grades page), not in a course's Grade Settings
    const LMS = {brightspace: {host: "learn.testu.ca", mode: "api", name: ""}}, MANUAL = {ai: {auto: false}};
    const SCALE8 = [["A+", 90], ["A", 85], ["A-", 80], ["B+", 76], ["B", 72], ["C", 60], ["D", 50], ["F", 0]].map(([letter, min]) => ({letter, min}));
    const FOUND = (o) => Object.assign({found: true, school: "Test University", scale: SCALE8, pass: 55, note: ""}, o || {});
    const openOpts = async page => { await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "gp-opts"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForSelector("#gsSchool"); };
    const chips = page => page.$$eval("#goPrev .go-chip", cs => cs.map(c => c.textContent.trim()));
    const saved = page => page.evaluate(() => { const d = JSON.parse(localStorage.getItem("coursework:v2")); return {g: (d.settings || {}).grades || {}, c: d.courses}; });
    { const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL)});
      await openSettings(page);
      ok(await page.locator("#dlg #gsSchool").count() === 0 && await page.locator("#dlg #gsProgram").count() === 0, "a course's Grade Settings has no school or program lookup");
      ok(await page.locator('#dlg .gr-scale-look [data-act="gp-opts"]').count() === 1, "it points to Grade Options instead");
      await page.click('#dlg .gr-scale-look [data-act="gp-opts"]'); await page.waitForSelector("#dlg[open] #gsSchool");
      ok(/Grade Options/.test(await page.textContent("#dlg[open] .sheet")) && /Grade Scale for All Courses/.test(await page.textContent("#dlg[open] .sheet")), "which opens Grade Options at the school scale section");
      ok(page.errs.length === 0, "no page errors " + page.errs.join(";")); await ctx.close(); }
    {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND()});
      await openOpts(page);
      ok(/learn\.testu\.ca/.test(await page.textContent("#gsSchool")) && await page.locator("#gsFind").count() === 1 && await page.locator("#gsProgram").count() === 1, "Grade Options recognises the connected learning site, with a program box");
      ok(/standard .* scale/.test(await page.textContent(".go-scale-h")), "it says which scale is in use now");
      ok(ctx.calls === 0, "nothing is asked until the button is pressed, and nothing runs in the background");
      await page.click("#gsFind"); await page.waitForFunction(() => /hasn't been checked online/.test(document.querySelector("#gsSchool").textContent));
      ok(JSON.stringify(await chips(page)) === JSON.stringify(SCALE8.map(x => x.letter + " " + x.min)) && await page.inputValue("#goPass") === "55", "what was found is shown to check, with its pass mark");
      const body = ctx.bodies[0], txt = JSON.stringify(body);
      ok(body.tools && !ctx.bodies[1].tools && ctx.calls === 2, "it searches the web first, and answers from memory when the search finds no page");
      ok(/learn\.testu\.ca/.test(txt) && !/Biology|BIO1/.test(txt), "only the site address is sent, nothing about the student's courses");
      ok(!((await saved(page)).g.scale), "nothing is saved until Use for All My Courses");
      await page.click("#goUse"); await page.waitForTimeout(400);
      const sv = await saved(page); ok(sv.g.pass === 55 && sv.g.scale && sv.g.scale.length === 8 && sv.g.school && sv.g.school.name === "Test University", "Use for All My Courses saves the scale and pass mark for all courses: " + JSON.stringify([sv.g.pass, sv.g.scale && sv.g.scale.length]));
      ok(/Now using Test University's scale/.test(await page.textContent("#dlg[open] .go-scale-h")), "Grade Options now says it's using that scale");
      ok(page.errs.length === 0, "no page errors " + page.errs.join(";")); await ctx.close(); }
    {
      // a course with its own scale follows the looked-up one, and Undo puts it back
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND()});
      await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("coursework:v2")); d.courses[0].grading = {scale: [["P", 50], ["F", 0]]}; localStorage.setItem("coursework:v2", JSON.stringify(d)); }); await page.reload(); await page.waitForFunction(() => window.__sbGrades);
      await openOpts(page); await page.click("#gsFind"); await page.waitForSelector("#goUse"); await page.click("#goUse"); await page.waitForTimeout(400);
      ok(!(await saved(page)).c[0].grading.scale, "a course with its own scale now follows the school's");
      await page.click("#toastUndo"); await page.waitForTimeout(400);
      ok(JSON.stringify((await saved(page)).c[0].grading.scale) === JSON.stringify([["P", 50], ["F", 0]]), "Undo gives it back its own scale");
      await ctx.close(); }
    for (const [what, reply] of [["found: false", {found: false, scale: []}], ["too few letters", FOUND({scale: SCALE8.slice(0, 2)})]]) {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply});
      await openOpts(page); await page.click("#gsFind"); await page.waitForFunction(() => /Upload a screenshot/.test(document.querySelector("#gsMsg").textContent));
      ok(await page.locator("#goUse").count() === 0 && !(await page.isDisabled("#gsFind")), `${what}: nothing to use, it points to uploading in a course, and the button works again`); await ctx.close(); }
    {
      const {ctx, page} = await mk({settings: Object.assign({}, LMS)}); await openOpts(page); await page.click("#gsFind");
      ok(/needs AI/.test(await msg(page)) && ctx.calls === 0, "without AI it says so"); await ctx.close(); }
    {
      const {ctx, page} = await mk({ai: true, settings: MANUAL, reply: FOUND()});
      await openOpts(page); await page.click("#gsFind"); ok(/Type your school's name/.test(await msg(page)) && ctx.calls === 0, "asks for the school's name when no site is connected");
      await page.fill("#gsSchoolName", "Test University"); await page.click("#gsFind"); await page.waitForFunction(() => /best knowledge/.test(document.querySelector("#gsSchool").textContent));
      ok(/Test University/.test(JSON.stringify(ctx.bodies[0])), "the typed name is what is asked about"); ok((await chips(page)).length === 8, "and the scale is shown"); await ctx.close(); }
    {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({scope: "program", program: "Nursing"})});
      await openOpts(page); await page.fill("#gsProgram", "Nursing");
      ok(/Find My Program's Scale/.test(await page.textContent("#gsFind")), "with a program typed, the button says it finds the program's scale");
      await page.click("#gsFind"); await page.waitForFunction(() => /the Nursing scale at Test University/.test(document.querySelector("#gsSchool").textContent));
      ok(/program: Nursing/.test(JSON.stringify(ctx.bodies[0])), "the program is sent with the school");
      ok(await page.inputValue("#gsProgram") === "Nursing", "the program box keeps what was typed");
      ok(!(await page.isDisabled("#gsFind")) && /Look Up This Program's Scale/.test(await page.textContent("#gsFind")), "the Look Up button stays usable after a lookup (it used to grey out)");
      await page.click("#goUse"); await page.waitForTimeout(400);
      const sv = await saved(page); ok(sv.g.program === "Nursing" && sv.g.school.scope === "program", "the program is remembered with the scale");
      ok(/Now using the Nursing scale at Test University/.test(await page.textContent("#dlg[open] .go-scale-h")) && await page.inputValue("#gsProgram") === "Nursing", "and shown when Grade Options opens again");
      await ctx.close(); }
    {
      // looked up first, program typed after: the button (and Enter) looks again for that program
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({scope: "school"})});
      await openOpts(page); await page.click("#gsFind"); await page.waitForFunction(() => /general scale/.test(document.querySelector("#gsSchool").textContent));
      ok(!(await page.isDisabled("#gsFind")) && /Search Again/.test(await page.textContent("#gsFind")), "after a lookup with no program, the button can search again");
      await page.fill("#gsProgram", "nursing");
      ok(/Look Up This Program's Scale/.test(await page.textContent("#gsFind")), "typing a program makes it Look Up This Program's Scale");
      ctx.reply = FOUND({scope: "program", program: "Nursing"});
      await page.click("#gsFind"); await page.waitForFunction(() => /the Nursing scale at Test University/.test(document.querySelector("#gsSchool").textContent));
      ok(ctx.calls === 4 && /program: nursing/.test(JSON.stringify(ctx.bodies[3])), "it asks again, for that program");
      await page.fill("#gsProgram", "Practical Nursing"); await page.press("#gsProgram", "Enter"); await page.waitForTimeout(500);
      ok(ctx.calls === 6 && /Practical Nursing/.test(JSON.stringify(ctx.bodies[5])) && await page.locator("#dlg[open] #gsSchool").count() === 1, "Enter in the program box looks it up too, without closing the sheet");
      await ctx.close(); }
    {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({scope: "school"})});
      await openOpts(page); await page.fill("#gsProgram", "Geology"); await page.click("#gsFind");
      await page.waitForFunction(() => /general scale \(no separate Geology scale found\)/.test(document.querySelector("#gsSchool").textContent));
      ok((await chips(page)).length === 8, "falls back to the school's scale"); await ctx.close(); }
    {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL, {area: {id: "health", text: "Nursing"}}), reply: FOUND()});
      await openOpts(page); ok(await page.inputValue("#gsProgram") === "Nursing", "prefilled from the area of study"); await ctx.close(); }
    {
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND(), limitSearch: true});
      ctx.limitAll = true; await openOpts(page); await page.click("#gsFind"); await page.waitForFunction(() => /Google said/.test(document.querySelector("#gsMsg").textContent));
      ok(/Quota exceeded/.test(await msg(page)), "the rate-limit message includes what Google said"); await ctx.close(); }
    {
      // found on the school's own website: one web search, the page linked, and the program's own pass mark
      const NURS = FOUND({scope: "program", program: "Nursing", pass: 65, url: "https://www.testu.ca/nursing/progression", scale: [["A+", 90], ["A", 85], ["A-", 80], ["B+", 77], ["B", 73], ["B-", 70], ["C+", 65], ["C", 60], ["P", 50], ["F", 0]].map(([letter, min]) => ({letter, min}))});
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: NURS, grounding: [{web: {uri: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc", title: "testu.ca"}}]});
      await openOpts(page); await page.fill("#gsProgram", "Nursing"); await page.click("#gsFind"); await page.waitForSelector("#goUse");
      const t = await page.textContent("#gsSchool");
      ok(ctx.calls === 1 && ctx.bodies[0].tools && /Found Test University's Nursing grade scale and 65% pass mark on the school's own website/.test(t), "found on the school's own site with one web search: " + t);
      ok(await page.locator('#gsSchool a[href="https://www.testu.ca/nursing/progression"]').count() === 1, "the page it came from is linked");
      ok(/minimum final percent a student needs to pass a course/.test(ctx.bodies[0].systemInstruction.parts[0].text) && /nursing/i.test(ctx.bodies[0].systemInstruction.parts[0].text), "the AI is told a program's pass mark can be higher than the lowest letter");
      ok(await page.inputValue("#goPass") === "65" && /higher than the lowest passing letter \(P, 50%\)/.test(await page.textContent("#goPassNote")), "the pass mark is shown in a box, with why it's above the lowest passing letter");
      await ctx.close(); }
    {
      // a page that isn't the school's own: said plainly
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({url: "https://gradescales.example.com/testu"}), grounding: [{web: {uri: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/x", title: "gradescales.example.com"}}]});
      await openOpts(page); await page.click("#gsFind"); await page.waitForSelector("#goUse");
      ok(/on gradescales\.example\.com, which isn't the school's own website/.test(await page.textContent("#gsSchool")), "a scale from another site says it isn't the school's own");
      await ctx.close(); }
    {
      // the answer contradicts itself (pass 60, lowest passing letter P at 50) and is wrong anyway: the student fixes it before using it
      const BAD = FOUND({scope: "program", program: "Nursing", pass: 60, scale: [["A", 85], ["B", 73], ["C", 60], ["P", 50], ["F", 0]].map(([letter, min]) => ({letter, min}))});
      const {ctx, page} = await mk({ai: true, settings: Object.assign({}, LMS, MANUAL), reply: BAD});
      await openOpts(page); await page.fill("#gsProgram", "Nursing"); await page.click("#gsFind"); await page.waitForSelector("#goUse");
      ok(/higher than the lowest passing letter \(P, 50%\)/.test(await page.textContent("#goPassNote")), "a pass mark that doesn't match the letters is pointed out");
      await page.fill("#goPass", "65");
      await page.click("#goEdit"); ok(await page.locator("#goRows .gr-scale-row").count() === 5, "Change Letters turns the letters into boxes");
      await page.fill('#goRows .gr-scale-row:nth-child(4) input[name="sl"]', "C-"); await page.fill('#goRows .gr-scale-row:nth-child(4) input[name="sp"]', "55");
      await page.click("#goUse"); await page.waitForTimeout(400);
      const sv = await saved(page);
      ok(sv.g.pass === 65 && JSON.stringify(sv.g.scale) === JSON.stringify([["A", 85], ["B", 73], ["C", 60], ["C-", 55], ["F", 0]]), "the corrected pass mark and letters are what's saved: " + JSON.stringify([sv.g.pass, sv.g.scale]));
      await ctx.close(); }
    for (const W of [1280, 390]) {
      const {ctx, page} = await mk({ai: true, w: W, settings: Object.assign({}, LMS, MANUAL), reply: FOUND({scope: "program", program: "Nursing"})});
      await openOpts(page); await page.fill("#gsProgram", "Nursing"); await page.click("#gsFind"); await page.waitForSelector("#goUse");
      ok(await page.evaluate(() => { const b = document.querySelector("#dlg[open] .sheet-body"); return b.scrollWidth <= b.clientWidth + 1; }), "no sideways scroll in Grade Options at " + W + "px");
      if (process.env.SHOT) { await page.evaluate(() => document.querySelector(".go-scale").scrollIntoView({block: "center"})); await page.waitForTimeout(200); await page.locator("#dlg[open] .sheet").screenshot({path: process.env.SHOT + "/opts-scale-" + W + ".png"}); }
      await ctx.close(); }
    { const {ctx, page} = await mk({});
      await openSettings(page);
      ok(JSON.stringify(await page.$$eval("#gsPreset option", o => o.map(x => x.value).filter(Boolean))) === JSON.stringify(["us", "ca", "uk"]), "standard scales to choose from: US, Canada and UK");
      await page.selectOption("#gsPreset", "uk");
      ok(JSON.stringify((await rows(page)).map(r => r[0])) === JSON.stringify(["1ST", "2:1", "2:2", "3RD", "F"]) && await page.inputValue('input[name="pass"]') === "40" && /UK Degree Classes/.test(await msg(page)), "choosing the UK scale fills in degree classes and a 40% pass mark");
      await page.selectOption("#gsPreset", "ca");
      ok(JSON.stringify((await rows(page))[2]) === JSON.stringify(["A-", "80"]) && await page.inputValue('input[name="pass"]') === "50", "the Canadian scale has A- at 80 and a 50% pass mark");
      await page.fill('#gsRows .gr-scale-row:nth-child(1) input[name="sl"]', "Z"); await page.selectOption("#gsPreset", "us");
      ok((await rows(page))[0][0] === "A+" && /US 10-Point/.test(await msg(page)), "picking a standard scale again brings the boxes back");
      await page.click("[data-submit]"); await page.waitForTimeout(250);
      const c = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).courses[0].grading);
      ok(c.pass === null, "a course saved with the default pass mark keeps following the default (not pinned): " + JSON.stringify(c.pass));
      await ctx.close(); }
    { const {ctx, page} = await mk({});
      const t = await page.evaluate(() => { const G = window.__sbGrades, S = [{letter: "A", min: 90}, {letter: "B", min: 80}, {letter: "C", min: 70}, {letter: "D", min: 50}]; return {ok: G.vetSchool({data: {found: true, school: "Test U", scale: S, pass: 50}}), few: G.vetSchool({data: {found: true, scale: S.slice(0, 2)}}), no: G.vetSchool({data: {found: false}}), badPass: G.vetSchool({data: {found: true, scale: S, pass: 500}})}; });
      ok(t.ok && t.ok.official === false && t.ok.recalled && t.ok.pass === 50, "a complete scale is accepted but never marked official");
      ok(t.few === null && t.no === null, "a short scale or found: false gives nothing");
      ok(t.badPass && t.badPass.pass === null, "an impossible pass mark is dropped"); await ctx.close(); }
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
