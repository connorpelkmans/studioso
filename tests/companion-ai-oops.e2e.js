// The companion says "that didn't work" only when the job really failed: not when one AI request failed but the feature still
// showed its result (another try, another AI, or the app's own reading)
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const file = path.resolve(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 860}}), page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(() => {
      window.__SB_TEST = true; window.__SB_CP_FAIL_GAP = 1500; window.__SB_CP_GAP = 300;
      try {
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], notes: [], decks: [], courses: [], settings: {capacity: 15, dailyHours: 3}}));
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
      } catch (e) {}
    });
    await ctx.route(/generativelanguage\.googleapis\.com/, r => r.fulfill({status: 400, contentType: "application/json", body: JSON.stringify({error: {code: 400, message: "bad request", status: "INVALID_ARGUMENT"}})}));
    await page.goto("file://" + file); await page.waitForTimeout(2500);
    const said = () => page.evaluate(() => [...document.querySelectorAll(".cp-bubble")].map(b => b.textContent).join(" | "));
    const fail = () => page.evaluate(() => window.__sbDevAI.call({system: "x", parts: [{text: "add hw4 due friday 2pm"}], task: "quickadd"}).then(() => "ok", e => "failed"));
    ok(await page.evaluate(() => !!document.querySelector(".cp-bubble") || !!window.__sbDevAI), "the companion and the AI are here");

    // 1. a request fails, but the feature shows its result anyway: no apology
    ok(await fail() === "failed", "the AI request failed (as set up)");
    await page.evaluate(() => { const d = document.querySelector("dialog"); d.innerHTML = `<div class="sheet"><div class="sheet-head"><h2>Add this task?</h2></div><div class="sheet-body">hw4</div></div>`; if (!d.open) d.showModal(); });
    await page.waitForTimeout(2600);
    ok(!/didn't work|got stuck/.test(await said()), "with the result on screen, it doesn't say it failed: " + await said());
    await page.keyboard.press("Escape"); await page.waitForTimeout(800);

    // 2. a request fails and nothing comes of it: it says so
    ok(await fail() === "failed", "another request fails");
    await page.waitForTimeout(2600);
    ok(/didn't work|got stuck/.test(await said()), "with nothing shown, it says it didn't work: " + await said());
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`companion-ai-oops e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
