// node tests/guest-mode.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const DAY = 864e5;
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
  await ctx.route(/supabase\.co/, r => r.abort());
  try {
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForSelector("#sbStart", {timeout: 15000});
    ok(/Get Started/.test(await page.textContent("#sbStart")) && await page.locator('dialog[open] .sb-welc [data-sbm="signin"]').count() === 1, "the first screen is Mochi's welcome with Get Started and I Already Have an Account");
    ok(!(await page.locator("#sbGate").count()), "there's no sign-in wall");
    await page.click('dialog[open] .sb-welc [data-sbm="signin"]');
    await page.waitForSelector("dialog[open] #sbLater", {timeout: 5000});
    ok(/Use Without an Account/.test(await page.textContent("#sbLater")) && await page.locator("dialog[open] input[name=email]").count() === 1, "I Already Have an Account opens the sign-in form, which still offers Use Without an Account");
    await page.click("#sbLater");
    await page.waitForFunction(() => window.SBGUEST && SBGUEST.is(), null, {timeout: 5000});
    ok(!(await page.isVisible("#guestBadge")) && !(await page.isVisible("#guestBadgeSide")), "after choosing it, no Save button is put in the header or side bar (saving is automatic)");
    ok(await page.evaluate(() => SBGUEST.is() && localStorage.getItem("studioso:sb") === '"local"'), "Studyboard is in guest mode");
    await page.waitForSelector(".sheet.ob", {timeout: 8000});
    for (let i = 0; i < 14 && (await page.getAttribute(".sheet.ob", "data-step")) !== "done"; i++) {
      if ((await page.getAttribute(".sheet.ob", "data-step")) === "courses") { await page.fill("#obCode", "BIOL 101"); await page.fill("#obName", "Biology"); await page.click('[data-ob="add-course"]'); await page.waitForTimeout(150); }
      await page.click('[data-ob="next"]'); await page.waitForTimeout(120);
    }
    ok(/Keep Your Planner Safe/.test(await page.textContent(".sheet.ob")) && await page.locator('[data-ob="account"]').count() === 1, "the tour's last page offers a free account");
    await page.click('[data-ob="finish"]'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => Object.keys(SBLMS.st().courses).length === 1), "the course added in the tour is there, on this device");
    await page.click('nav.tabs .nav-tool[data-act="menu"]');
    await page.waitForSelector('dialog[open] [data-act="sb-signin"]', {timeout: 5000});
    const acct = await page.textContent('dialog[open] [data-act="sb-signin"]');
    ok(/Sign In or Create Account/.test(acct) && /only on this device/i.test(acct) && /comes with you/.test(acct), "Settings offers one Sign In or Create Account row that says it's only here and comes along into an account");
    ok(await page.locator('dialog[open] [data-act="guest-save"]').count() === 0, "no second Save Your Planner row doing the same thing");
    await page.click('dialog[open] [data-act="sb-signin"]');
    await page.waitForSelector('dialog[open] form.sb-acct [data-sbm="signup"]', {timeout: 15000});
    await page.click('dialog[open] [data-sbm="signup"]');
    await page.waitForFunction(() => /Create Your Studyboard Account/.test((document.querySelector("dialog[open]") || {}).textContent || ""), null, {timeout: 15000});
    ok(true, "Create a Free Account opens the sign-up form");
    await page.click('dialog[open] #sbLater'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => SBGUEST.is()), "Not Now there keeps them working without an account");
    const imp = async () => page.evaluate(day => { const L = SBLMS.brightspace, d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
      courses: [{ou: "77", code: "BIOL101", name: "Biology", folders: [{id: "1" + Math.random().toString().slice(2, 6), name: "Lab Report " + Math.random().toString().slice(2, 5), due: day, end: null, sub: false, files: []}], quizzes: [], grades: [], news: [], events: []}]});
      L.applyPlan(d, L.plan(d), "grab", true); }, new Date(Date.now() + 5 * DAY).toISOString());
    await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    await imp();
    await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    await page.waitForFunction(() => /work is only on this device/.test((document.getElementById("toastMsg") || {}).textContent || ""), null, {timeout: 12000});
    ok(/Save It/.test(await page.textContent("#toastExtra")), "after the first school import: it's only on this device, with Save It");
    await page.evaluate(() => { document.getElementById("toastMsg").textContent = ""; });
    await imp(); await page.waitForTimeout(7000);
    ok(!/work is only on this device/.test(await page.textContent("#toastMsg")), "a second import doesn't ask again");
    await page.evaluate(() => { localStorage.setItem("studyboard:guest:since", String(Date.now() - 4 * 864e5)); localStorage.setItem("studyboard:guest:asked", String(Date.now() - 8 * 864e5)); });
    await page.reload();
    await page.waitForFunction(() => /still only on this device/.test((document.getElementById("toastMsg") || {}).textContent || ""), null, {timeout: 15000});
    ok(true, "after a few days, opening Studyboard reminds them once");
    await page.reload(); await page.waitForTimeout(8000);
    ok(!/still only on this device/.test(await page.textContent("#toastMsg")), "and not again the next time they open it that week");
    ok(!(await page.locator('dialog[open] #sbLater').count()), "no sign-in window is put up on opening");
    await page.screenshot({path: path.join(require("os").tmpdir(), "guest-desktop.png")});
    const ph = await browser.newPage({viewport: {width: 390, height: 844}});
    await ph.route(/supabase\.co/, r => r.abort());
    await ph.goto(base); await ph.evaluate(() => { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); });
    await ph.reload(); await ph.waitForTimeout(1500);
    ok(!(await ph.isVisible("#guestBadge")), "on a phone the header has no Save button");
    ok(await ph.evaluate(() => { const s = document.getElementById("sync"); return s.dataset.state === "ok" && !s.offsetWidth; }), "...and no saved dot");
    await ph.screenshot({path: path.join(require("os").tmpdir(), "guest-phone.png")});
    await ph.close();
    ok(await page.isVisible("#syncSide") && await page.getAttribute("#syncSide", "data-state") === "ok", "on a computer the side bar shows the green saved dot");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nguest-mode.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
