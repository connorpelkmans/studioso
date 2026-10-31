// node tools/capture-ios-screens.js [outDir] [only...]
// App Store screenshots for iPhone (6.9", 1320x2868): app screens captured at iPhone size with the app tour's sample semester
// (the same one tools/capture-store-screens.js uses), then framed with a headline on Studyboard's navy (tools/ios-frame.html).
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, ".."), OUT = process.argv[2] || path.join(root, "build-resources/ios-listing/screenshots");
fs.mkdirSync(path.join(OUT, "raw"), {recursive: true});
// the sample semester, taken from the Microsoft Store script so both stay the same
const src = fs.readFileSync(path.join(__dirname, "capture-store-screens.js"), "utf8");
const {SEED, NOW} = new Function(src.slice(src.indexOf("const NOW"), src.indexOf("// file name, theme")) + "\nreturn {SEED, NOW};")();
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (p === "/index.html" && /[?&]pro=off\b/.test(q.url)) { r.writeHead(200, {"content-type": "text/html"}); r.end(require("../scripts/csp").apply(require("../scripts/app-files").source().replace("const PRO_ENFORCED = true", "const PRO_ENFORCED = false"))); return; }
  r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });

// name, headline, theme, light/dark, tab, then buttons inside the page by label (or a function run on the page)
const SHOTS = [
  ["01-today", "Your day, planned for you", "classic", "light", "board", ["Today's Plan"]],
  ["02-board", "Every assignment at a glance", "sakura", "light", "board", ["Task Board"]],
  ["03-due", "Never miss a deadline", "ocean", "light", "plan", ["Due Dates", async page => page.evaluate(() => {
    // the day the essay draft is due (Thursday the 22nd), so the list under the month has something in it
    const d = document.querySelector('[data-act="pick-day"][data-id="2026-10-22"]');
    if (d) d.click(); })]],
  ["04-focus", "A focus timer that keeps you going", "galaxy", "dark", "board", [async page => page.evaluate(() => { const b = document.getElementById("pomoBtn"); if (b) b.click(); })]],
  ["05-grades", "Know where your grades stand", "arcade", "dark", "courses", ["Grades"]],
  ["06-cards", "Flashcards that help it stick", "spring", "light", "flashcards", []],
  ["07-companion", "A study buddy that cheers you on", "forest", "light", "companion", ["Wardrobe"]]];

const dismiss = async page => {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].filter(b => /^(Not now|No Thanks|Dismiss|Later|Not This Week|Skip|Got It|Maybe Later)$/i.test(b.textContent.trim()) && b.offsetParent).forEach(b => b.click());
      document.querySelectorAll("dialog[open]").forEach(d => { if (!d.querySelector(".pomo-sheet")) d.close(); });
    });
    await page.waitForTimeout(250);
  }
};
const press = async (page, label) => {
  if (typeof label === "function") { await label(page); await page.waitForTimeout(1200); return; }
  const ok = await page.evaluate(l => { const b = [...document.querySelectorAll("button, [role=tab], a")].find(e => e.offsetParent && e.textContent.trim().replace(/\s*\d+$/, "") === l && !e.closest("nav.tabs")); if (b) b.click(); return !!b; }, label);
  if (!ok) console.warn("  no button:", label);
  await page.waitForTimeout(1200);
};

async function shoot(browser, [name, , skin, scheme, tab, steps]) {
  // iPhone 6.9" (440 x 956 points at 3x = 1320 x 2868)
  const ctx = await browser.newContext({viewport: {width: 440, height: 902}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme, serviceWorkers: "block",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"});
  await ctx.clock.setFixedTime(NOW);
  const seed = JSON.parse(JSON.stringify(SEED)); seed.settings.style = {skin}; seed.settings.owned = ["skin:" + skin];
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
    localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:theme", scheme); } } catch (e) {} }, [seed, scheme]);
  const page = await ctx.newPage();
  await page.goto("http://localhost:" + server.address().port + "/?pro=off"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(3000);
  await page.addStyleTag({content: ".toast,#toast{display:none!important}"});
  await dismiss(page);
  await page.evaluate(t => { const b = document.querySelector(`nav.tabs [data-tab="${t}"]`); if (b) b.click(); }, tab); await page.waitForTimeout(1500);
  for (const s of steps) await press(page, s);
  if (name !== "04-focus") await dismiss(page);
  await page.evaluate(() => document.querySelectorAll(".cp-bubble.on").forEach(x => x.classList.remove("on")));
  await page.waitForTimeout(1500);
  await page.screenshot({path: path.join(OUT, "raw", name + ".png")}); console.log("captured", name);
  await ctx.close();
}
// The frame: headline over the screen, on Studyboard navy, at exactly 1320 x 2868
async function frame(browser, [name, headline]) {
  const ctx = await browser.newContext({viewport: {width: 440, height: 956}, deviceScaleFactor: 3});
  const page = await ctx.newPage(); await page.goto("http://localhost:" + server.address().port + "/tools/ios-frame.html");
  const shot = "data:image/png;base64," + fs.readFileSync(path.join(OUT, "raw", name + ".png")).toString("base64");
  await page.evaluate(([shot, headline]) => window.setShot(shot, headline), [shot, headline]);
  await page.evaluate(() => Promise.all([document.fonts.ready, document.getElementById("shot").decode()])); await page.waitForTimeout(300);
  await page.screenshot({path: path.join(OUT, name + ".png")}); console.log("framed", name);
  await ctx.close();
}

// For App Store Connect's subscription Review Information: the Pro sheet as the store app shows it, plain (no frame)
async function review(browser) {
  const ctx = await browser.newContext({viewport: {width: 440, height: 956}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: "light", serviceWorkers: "block",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"});
  await ctx.clock.setFixedTime(NOW);
  const seed = JSON.parse(JSON.stringify(SEED)); seed.settings.style = {skin: "classic"};
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
    localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:theme", "light"); localStorage.setItem("studyboard:paywall-test", "1"); } } catch (e) {}
    // the store app outside the US: in-app purchase, Apple's renewal terms
    window.StudyboardNative = {platform: "ios", purchasesAvailable: true, externalPurchase: false, storefront: "CAN"}; }, seed);
  const page = await ctx.newPage();
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(3000);
  await page.addStyleTag({content: ".toast,#toast{display:none!important}"});
  await dismiss(page);
  await page.evaluate(() => window.__sbPlanObj && window.__sbPlanObj().openSheet()); await page.waitForTimeout(1500);
  await page.screenshot({path: path.join(OUT, "review-pro-sheet.png")}); console.log("captured review-pro-sheet");
  await ctx.close();
}

(async () => {
  await new Promise(r => server.listen(0, r)); const browser = await chromium.launch({executablePath});
  const only = process.argv.slice(3);
  try {
    for (const s of SHOTS) if (!only.length || only.includes(s[0])) { await shoot(browser, s); await frame(browser, s); }
    if (!only.length || only.includes("review")) await review(browser);
  }
  finally { await browser.close(); server.close(); }
  console.log("done:", OUT);
})().catch(e => { console.error(e); process.exit(1); });
