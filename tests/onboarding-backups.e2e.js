// node tests/onboarding-backups.e2e.js
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
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const open = async noPicker => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(noPicker => {
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } catch (e) {}
      if (noPicker) { try { delete window.showDirectoryPicker; } catch (e) {} window.showDirectoryPicker = undefined; }
      else window.showDirectoryPicker = async () => { window.__picked = (window.__picked || 0) + 1; const r = await navigator.storage.getDirectory(); return r.getDirectoryHandle("My Drive", {create: true}); };
    }, noPicker);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector(".sheet.ob", {timeout: 15000});
    return {ctx, page};
  };
  try {
    const {ctx, page} = await open(false);
    const first = [];
    for (let i = 0; i < 12; i++) {
      const s = await page.getAttribute(".sheet.ob", "data-step"); first.push(s); if (s === "done") break;
      if (s === "courses") { await page.fill("#obCode", "BIOL 101"); await page.fill("#obName", "Biology"); }
      await page.click('[data-ob="next"]'); await page.waitForTimeout(120);
    }
    ok(first.join() === "area,courses,hours,done", "the first-run setup asks only the essentials: " + first.join(", "));
    ok(await page.evaluate(() => Object.values(SBLMS.st().courses).some(c => c.code === "BIOL 101")), "a course typed but not added yet comes along on Next");
    await page.click('.sheet.ob .ob-go'); await page.waitForTimeout(300);
    ok(await page.locator(".ob-more-b").count() === 0 && await page.locator(".sem-card-b").count() === 0, "nothing more is pushed on the same day: no A Few More Things card and no second setup card");
    const later = async pg => { await pg.waitForTimeout(1600); if (await pg.evaluate(() => window.SBTOUR && SBTOUR.active())) { await pg.keyboard.press("Escape"); await pg.waitForTimeout(300); }
      await pg.evaluate(() => { const k = "sb:onboarded:more", m = JSON.parse(localStorage.getItem(k) || "{}"); m.at = Date.now() - 2 * 864e5; localStorage.setItem(k, JSON.stringify(m)); });
      await pg.click('nav.tabs [data-tab="courses"]'); await pg.waitForTimeout(150); await pg.click('nav.tabs [data-tab="board"]'); await pg.waitForTimeout(250);
      if (await pg.locator('.sem-card-b [data-act="sem-hide"]').count()) { await pg.click('.sem-card-b [data-act="sem-hide"]'); await pg.waitForTimeout(250); } };
    await later(page);
    ok(await page.locator('.ob-more-b [data-act="ob-more"]').count() === 1 && /Reminders, backups, the app and a theme/.test(await page.textContent(".ob-more-b")), "a day later a small card on the Board offers the rest");
    await page.click('.ob-more-b [data-act="ob-more"]'); await page.waitForSelector(".sheet.ob");
    for (let i = 0; i < 12 && (await page.getAttribute(".sheet.ob", "data-step")) !== "backups"; i++) { await page.click('[data-ob="next"]'); await page.waitForTimeout(120); }
    ok(await page.getAttribute(".sheet.ob", "data-step") === "backups", "it has a Backups step in Chrome and Edge");
    ok(/Allow on every visit/.test(await page.textContent(".sheet.ob")) && await page.locator('[data-ob="backup-folder"]').count() === 3, "it offers Google Drive, OneDrive or another folder, and says which permission to choose");
    await page.click('[data-ob="backup-folder"][data-id="gdrive"]');
    await page.waitForFunction(() => /Automatic Backups Are On/.test((document.querySelector(".sheet.ob") || {}).textContent || ""), null, {timeout: 8000});
    ok(/Google Drive › My Drive › Studyboard Backups/.test(await page.textContent(".sheet.ob")), "after picking, the step says where backups are saved");
    const files = await page.evaluate(async () => { const r = await navigator.storage.getDirectory(), d = await (await r.getDirectoryHandle("My Drive")).getDirectoryHandle("Studyboard Backups"); const out = []; for await (const [name] of d.entries()) out.push(name); return out; });
    ok(files.length > 0, "a backup is written to the folder right away: " + JSON.stringify(files));
    for (let i = 0; i < 4 && (await page.getAttribute(".sheet.ob", "data-step")) !== "done"; i++) { await page.click('[data-ob="next"]'); await page.waitForTimeout(120); }
    ok(/Backing up to Google Drive/.test(await page.textContent(".sheet.ob")), "the last page lists automatic backups as set up");
    await page.click('.sheet.ob .ob-go'); await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => document.querySelector("#dlg").open)) && await page.locator(".ob-more-b").count() === 0, "Done closes it, and the card is gone");
    await ctx.close();
    const b = await open(true);
    for (let i = 0; i < 8 && (await b.page.getAttribute(".sheet.ob", "data-step")) !== "done"; i++) { await b.page.click('[data-ob="next"]'); await b.page.waitForTimeout(120); }
    ok(await b.page.evaluate(() => window.SBOB.pending()), "while the setup is open, the free week's welcome waits for it");
    ok(!/is on us/.test(await b.page.textContent(".sheet.ob")) && await b.page.locator(".ob-gift").count() === 0, "no free week, no gift card");
    await b.page.evaluate(() => { window.__said = 0; SBOB.T.plan = {welcomeWeek: () => ({until: "2026-10-27T12:00:00Z", date: "Oct 27, 2026"}), welcomeSaid: () => { window.__said++; }};
      const segs = document.querySelectorAll(".ob-seg"); segs[segs.length - 1].click(); });
    await b.page.waitForTimeout(250); await b.page.click(".sheet.ob .ob-go"); await b.page.waitForTimeout(250);
    const last = await b.page.textContent(".sheet.ob");
    ok(/Welcome to Studyboard!/.test(last) && await b.page.locator(".ob-gift").count() === 1 && /until Oct 27, 2026/.test(last), "the last page welcomes them and mentions the free week: " + last.replace(/\s+/g, " ").slice(0, 300));
    ok(await b.page.evaluate(() => window.__said > 0), "and marks the welcome as said, so it doesn't also pop up");
    ok(await b.page.locator("#toast.show, .toast.show").count() === 0, "no bottom pop-up about it");
    await b.page.click('.sheet.ob .ob-go'); await b.page.waitForTimeout(300);
    await b.page.evaluate(() => { SBOB.T.plan = null; });
    await later(b.page);
    await b.page.click('.ob-more-b [data-act="ob-more"]'); await b.page.waitForSelector(".sheet.ob");
    const more = [];
    for (let i = 0; i < 12; i++) { const s = await b.page.getAttribute(".sheet.ob", "data-step"); more.push(s); if (s === "done") break; await b.page.click('[data-ob="next"]'); await b.page.waitForTimeout(120); }
    ok(!more.includes("backups") && more[0] === "theme" && more.includes("reminders") && more.includes("app"), "without folder access (Safari, Firefox) the Backups step isn't shown: " + more.join(", "));
    ok(!(await b.page.textContent(".sheet.ob")).includes("Backing up to"), "and the last page doesn't mention it");
    if (more.includes("pro")) {
      await b.page.evaluate(() => { SBOB.T.plan = {welcomeWeek: () => ({until: "2026-10-27T12:00:00Z", date: "Oct 27, 2026"}), welcomeSaid: () => {}};
        const segs = document.querySelectorAll(".ob-seg"); segs[segs.length - 1].click(); });
      await b.page.waitForTimeout(250);
      const proPage = await b.page.textContent(".sheet.ob");
      ok((await b.page.getAttribute(".sheet.ob", "data-step")) === "pro" && /Your First Week of Pro Is On Us/.test(proPage) && /No card needed/.test(proPage), "the free week has its own page in the later setup");
    }
    await b.ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nonboarding-backups.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
