// node tests/emails.e2e.js  (Playwright + Chromium; the desktop app's Canvas mail bridge is stubbed)
// Checks: the Emails tab sits between Grades and Files, lists the inbox, opens a thread, drafts and sends a reply; the tab selector doesn't move.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": p.endsWith(".js") ? "text/javascript" : p.endsWith(".html") ? "text/html" : "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SEED = {v: 2, courses: [{id: "c1", name: "Intro Biology", code: "BIO101", color: "#3B6FE0"}], tasks: [], settings: {capacity: 15, canvas: {mode: "api", host: "https://school.instructure.com"}}, updated: 1};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath: "/opt/pw-browsers/chromium"});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(seed => {
    try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {}
    window.__sent = [];
    window.studiosoDesktop = {platform: "win32", version: "test", store: "direct", lms: {mail: async (id, host, spec) => {
      if (spec.op === "list") return {ok: true, items: [{id: "11", subject: "Lab 3 question", preview: "Can you resend the rubric?", at: new Date().toISOString(), count: 2, unread: true, course: "BIO101", names: ["Dr. Reyes"]}]};
      if (spec.op === "get") return {ok: true, subject: "Lab 3 question", course: "BIO101", names: ["Dr. Reyes"], messages: [{id: "1", from: "Dr. Reyes", mine: false, at: new Date().toISOString(), body: "Can you resend the rubric?", files: 0}]};
      if (spec.op === "send") { window.__sent.push(spec); return {ok: true}; }
      return {error: "bad"}; }}};
    window.confirm = () => true;
  }, SEED);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => { if (!/DESK\./.test(e.message)) errs.push(e.message); });
  await page.goto(base); await page.waitForSelector('[data-tab="courses"]');
  await page.evaluate(() => [...document.querySelectorAll('[data-tab="courses"]')].find(e => e.offsetParent).click());
  await page.waitForSelector(".cf-tabs");
  const labels = await page.$$eval(".cf-tabs button", b => b.map(x => x.textContent.trim()));
  ok(labels.join(",") === "Courses,Grades,Emails,Files", "tab order is " + labels.join(", "));
  const box = async () => page.$eval(".cf-tabs", e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)].join(","); });
  const b1 = await box();
  await page.click('.cf-tabs [data-id="files"]'); await page.waitForSelector(".cf-tabs");
  ok(await box() === b1, "tab bar doesn't move on Files");
  await page.click('.cf-tabs [data-id="emails"]'); await page.waitForSelector(".em-item");
  ok(await box() === b1, "tab bar doesn't move on Emails");
  ok((await page.textContent(".em-item")).includes("Lab 3 question"), "the inbox lists the message");
  await page.click(".em-item"); await page.waitForSelector("#emDraft");
  ok((await page.textContent(".em-thread")).includes("resend the rubric"), "the thread opens");
  await page.fill("#emDraft", "Sure, sending it now."); await page.click('[data-act="em-send"]');
  await page.waitForFunction(() => window.__sent.length === 1);
  ok(await page.evaluate(() => __sent[0].body === "Sure, sending it now." && __sent[0].id === "11"), "the reply was sent through the bridge");
  ok(errs.length === 0, "no page errors: " + errs.join("; "));
  await browser.close(); server.close(); console.log(n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
