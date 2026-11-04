// node tests/signed-out.e2e.js (Playwright + Chromium; no network)
// Signed out of the hosted app: a study group invite asks you to sign in and keeps the invite for after;
// Report a Bug doesn't offer a screenshot the server would drop, and the shared rate limit doesn't blame you.
const path = require("path"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}}), page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.route(/^https?:\/\//, r => /\/rest\/v1\/bug_reports/.test(r.request().url()) ? r.fulfill({status: 429, body: '{"message":"SB_RATE: too many reports, try again later"}'}) : r.abort());
    await page.addInitScript(() => { try { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); } catch (e) {} });
    await page.goto("file://" + file + "?group=K7P4-QD9X");
    await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d && d.open) d.close(); });
    await page.waitForFunction(() => /Study Group Invite/.test((document.querySelector("#dlg[open]") || {}).innerText || ""), null, {timeout: 15000});
    ok(/K7P4-QD9X/.test(await page.textContent("#dlg")) && await page.locator('#dlg [data-act="sb-signin"]').count() === 1, "the invite says what it is and offers Sign In");
    ok(await page.evaluate(() => !!localStorage.getItem("sb:grpPending")), "the invite is kept so it opens after signing in");
    await page.evaluate(() => document.querySelector("#dlg").close()); await page.waitForTimeout(5000);
    ok(await page.locator("#dlg[open]").count() === 0, "closing it doesn't make it come back");

    await page.evaluate(() => window.SBFEEDBACK.open()); await page.waitForSelector("#dlg[open] .bug-sheet");
    ok(await page.locator("#bugFile").count() === 0 && /sign in first/.test(await page.textContent("#bugShotNote")), "signed out, Report a Bug says to sign in to attach a screenshot instead of offering one");
    await page.fill("#bugMsg", "The calendar shows the wrong week"); await page.click("#dlg[open] [data-submit]");
    await page.waitForFunction(() => /\S/.test((document.querySelector("#bugMsgOut") || {}).textContent || ""), null, {timeout: 5000});
    const said = await page.textContent("#bugMsgOut");
    ok(/Lots of reports are coming in/.test(said) && !/You've sent/.test(said), "the shared rate limit doesn't blame you: " + said);
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`signed-out.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
