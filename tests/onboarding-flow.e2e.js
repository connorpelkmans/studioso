// node tests/onboarding-flow.e2e.js (Playwright + Chromium; no network)
// The first run is one flow: Mochi's welcome, three steps, a done page with one main button.
// Syllabi are read one after another from the courses step; Skip Setup ends on the done page; no tour starts by itself.
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return d.toLocaleDateString("en-US", {month: "long", day: "numeric"}); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/index.html";
  const browser = await chromium.launch({executablePath});
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-ob-"));
  const bio = path.join(dir, "bio.txt"), psy = path.join(dir, "psyc.txt");
  fs.writeFileSync(bio, `BIOL 101 Biology\nCourse syllabus\nLab report 1 due ${day(4)}\nMidterm exam ${day(20)}\n`);
  fs.writeFileSync(psy, `PSYC 1010 Intro to Psychology\nSyllabus\nReading response due ${day(4)}\nFinal paper due ${day(20)}\n`);
  const fresh = async () => {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}}); const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#sbStart", {timeout: 20000});
    return {ctx, page};
  };
  try {
    /* Skip Setup */
    {
      const {ctx, page} = await fresh();
      ok(/about a minute/.test(await page.textContent(".sb-welc")) && /crash reports/.test(await page.textContent(".sb-welc")), "Mochi's welcome says how long setup takes and mentions crash reports");
      await page.click("#sbStart"); await page.waitForSelector(".sheet.ob", {timeout: 10000});
      ok(await page.getAttribute(".sheet.ob", "data-step") === "area" && /Step 1 of 3/.test(await page.textContent(".ob-count")), "setup starts at step 1 of 3, What Do You Study");
      await page.click('[data-ob="skip"]'); await page.waitForTimeout(300);
      ok(await page.getAttribute(".sheet.ob", "data-step") === "done" && /No Problem/.test(await page.textContent(".sheet.ob")), "Skip Setup ends on the done page");
      ok(await page.locator(".ob-sum li.later").count() === 3 && await page.locator(".ob-later").first().textContent() === "Later", "skipped items say Later");
      ok(await page.locator(".ob-foot .btn.primary").count() === 1 && await page.locator('[data-ob="apptour"]').count() === 1, "one main button and a quiet tour link");
      await page.reload(); await page.waitForTimeout(2500);
      ok(await page.locator("dialog[open] .sheet.ob").count() === 0, "after Skip, the setup doesn't come back on reload");
      ok(await page.locator(".sem-card-b").count() === 0 && !(await page.evaluate(() => window.SBTOUR && SBTOUR.active())), "no semester card and no tour on their own");
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await ctx.close();
    }
    /* Two syllabi, Check Them, Finish */
    {
      const {ctx, page} = await fresh();
      await page.click("#sbStart"); await page.waitForSelector(".sheet.ob", {timeout: 10000});
      await page.click(".ob-go"); await page.waitForTimeout(300);
      ok(await page.getAttribute(".sheet.ob", "data-step") === "courses" && /Your Courses and Deadlines/.test(await page.textContent(".sheet.ob")), "step 2 is Your Courses and Deadlines");
      await page.setInputFiles("#obPdf", [bio, psy]);
      for (let k = 0; k < 2; k++) {
        await page.waitForFunction(() => /Import a Syllabus/.test((document.querySelector("dialog[open] .sheet") || {}).textContent || ""), null, {timeout: 15000});
        await page.waitForTimeout(400);
        await page.locator("dialog[open] [data-submit], dialog[open] button.primary").last().click();
        await page.waitForTimeout(700);
      }
      await page.waitForSelector("dialog[open] .sheet.ob", {timeout: 10000});
      const txt = await page.textContent(".sheet.ob");
      ok(await page.getAttribute(".sheet.ob", "data-step") === "courses" && /4 items found/.test(txt) && /BIOL 101/.test(txt) && /PSYC 1010/.test(txt), "both syllabi are read in turn and the setup comes back to the courses step");
      await page.click('[data-ob="check"]'); await page.waitForSelector("dialog[open] .sem-sheet");
      ok(await page.locator("dialog[open] .sem-r").count() === 4 && await page.locator("dialog[open] .sem-steps").count() === 0, "Check Them shows just the review list");
      await page.click('[data-sem="solo-done"]'); await page.waitForSelector("dialog[open] .sheet.ob", {timeout: 5000});
      ok(await page.getAttribute(".sheet.ob", "data-step") === "courses", "Done goes back to the setup");
      await page.click(".ob-go"); await page.waitForTimeout(300);
      ok((await page.textContent(".ob-go")).trim() === "Finish", "the last step's button says Finish");
      await page.click(".ob-go"); await page.waitForTimeout(400);
      ok(/2 courses and 4 dates added/.test(await page.textContent(".sheet.ob")) && await page.locator(".ob-week li").count() === 2, "the done page sums it up and lists what's due this week");
      ok((await page.textContent(".ob-go")).trim() === "Open Today's Plan", "with work added, the main button opens Today's Plan");
      await page.click(".ob-go"); await page.waitForTimeout(600);
      const ts = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("coursework:v2")).tasks));
      ok(ts.filter(t => !/exam|midterm/i.test(t.title)).every(t => Number(t.hours) > 0), "imported work gets a suggested time on Finish");
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); fs.rmSync(dir, {recursive: true, force: true}); }
  console.log(`onboarding-flow.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
