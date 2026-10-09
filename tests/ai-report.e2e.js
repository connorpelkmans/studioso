// node tests/ai-report.e2e.js  (Playwright + Chromium; the AI call and the bug_reports server are stubbed)
// Checks: an AI answer has a Report Response link (Microsoft Store policy 11.16); it opens the report form with the answer filled in and the
// "ai" category; the report sent carries the answer and which feature it came from; Settings, AI Features has the general report button.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": p.endsWith(".js") ? "text/javascript" : p.endsWith(".html") ? "text/html" : "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SEED = {v: 2, courses: [{id: "c1", name: "Intro Biology", code: "BIO101", color: "#3B6FE0"}], tasks: [], settings: {capacity: 15}, updated: 1};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
    localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, SEED);
  const reply = {answer: "Your BIO101 exam is on Friday. Something the student wants to report.", sources: [], followUps: [], actions: []};
  await ctx.route(/generativelanguage\.googleapis\.com/, route => route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})}));
  const sent = [];
  await ctx.route(/\/rest\/v1\/bug_reports/, route => { sent.push(JSON.parse(route.request().postData())); route.fulfill({status: 201, body: ""}); });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(base); await page.waitForFunction(() => window.SBCOMP && SBCOMP.tab && window.SBFEEDBACK);
  await page.evaluate(() => SBCOMPTAB.open());
  await page.waitForSelector("#cptIn");
  await page.fill("#cptIn", "When is my exam?");
  await page.click("#cptGo");
  await page.waitForSelector('[data-ai-report="companion-chat"]');
  ok(true, "the AI answer has a Report Response link");
  await page.click('[data-ai-report="companion-chat"]');
  await page.waitForSelector("form.bug-sheet");
  ok((await page.textContent("form.bug-sheet h2, form.bug-sheet .sheet-head")).includes("Report an AI Response"), "the form is titled Report an AI Response");
  ok(await page.$eval('form.bug-sheet [name="cat"]', s => s.value) === "ai", "the AI category is chosen");
  ok((await page.$eval('form.bug-sheet [name="steps"]', t => t.value)).includes("Something the student wants to report."), "the AI answer is filled in, where it can be edited");
  ok((await page.textContent("#bugDiag")).includes("ai: companion-chat"), "the diagnostics say which feature the answer came from");
  await page.fill("#bugMsg", "This answer was wrong about the exam.");
  // A server is needed to send: give the page one (the report goes to the stub above)
  await page.evaluate(() => { window.sbConfig = () => ({url: "https://stub.supabase.co", key: "anon"}); });
  await page.click("form.bug-sheet [data-submit]");
  await page.waitForFunction(() => !document.querySelector("form.bug-sheet"), null, {timeout: 8000}).catch(() => {});
  if (sent.length) {
    ok(sent[0].category === "ai" && /Something the student wants to report/.test(sent[0].steps) && sent[0].diagnostics.ai === "companion-chat", "the report sent carries the category, the answer and the feature");
  } else {
    const q = await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:bugq") || "[]"));
    ok(q.length === 1 && q[0].category === "ai" && /Something the student wants to report/.test(q[0].steps) && q[0].diagnostics.ai === "companion-chat", "the report (queued, no server here) carries the category, the answer and the feature");
  }
  // Settings, AI Features: the general button
  await page.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); });
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "ai-setup"; b.id = "t-ai-setup"; document.body.appendChild(b); });
  await page.click("#t-ai-setup");
  await page.waitForSelector('[data-ai-report="settings"]');
  await page.click('[data-ai-report="settings"]');
  await page.waitForSelector("form.bug-sheet");
  ok(await page.$eval('form.bug-sheet [name="cat"]', s => s.value) === "ai", "Settings, AI Features opens the AI report form");
  ok(errs.length === 0, "no page errors: " + errs.join("; "));
  await browser.close(); server.close(); console.log(n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
