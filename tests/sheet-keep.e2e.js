// node tests/sheet-keep.e2e.js
// Sheets keep their place: tapping away from Create with AI while it works (or from its Review) sets it aside; opening it
// again brings it back as it was; only Cancel clears it. A job that finishes while set aside says so in a toast.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const TEXT = "Osmosis is the passive movement of water across a selectively permeable membrane toward the side with more solute. Aquaporins are channel proteins that let water cross faster. A red blood cell in pure water swells and can burst (lysis); in very salty water it shrivels (crenation).";
const CARDS = {deckTitle: "Osmosis", cards: [
  {front: "What is osmosis?", back: "Water passively crossing a membrane toward more solute.", source: "Osmosis"},
  {front: "What do aquaporins do?", back: "Let water cross the membrane faster.", source: "Aquaporins"},
  {front: "What is crenation?", back: "A cell shrivelling in salty water.", source: "Tonicity"}]};
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}], decks: []};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
    let calls = 0, delay = 2500;
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      calls++; await new Promise(r => setTimeout(r, delay));
      try { await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(CARDS)}]}, finishReason: "STOP"}]})}); } catch (e) {}
    });
    await ctx.addInitScript(seed => {
      window.__SB_TEST = true;
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
    }, SEED);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    const openCreate = () => page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "fc-ai-cards"; document.body.appendChild(b); b.click(); b.remove(); });
    const isOpen = () => page.evaluate(() => document.getElementById("dlg").open);
    const away = async () => { await page.keyboard.press("Escape"); await page.waitForTimeout(250); };
    const toastText = () => page.evaluate(() => (document.getElementById("toastMsg") || {}).textContent || "");

    /* Create: the sheet closes and the set is built in its own deck, in view (tests/ai-live-set.e2e.js covers that in full);
       there's no job left in a sheet to set aside */
    await openCreate(); await page.waitForSelector("#aiGo");
    if (!(await page.evaluate(() => document.getElementById("aiPasteD").open))) await page.click("#aiPasteD summary");
    await page.fill("#aiPaste", TEXT); await page.selectOption("#aiCourse", "c1");
    await page.click("#aiGo"); await page.waitForTimeout(300);
    ok(!(await isOpen()) && !!(await page.$(".ai-live-bar")), "Create closes the sheet and the set is built in its deck");
    await page.waitForSelector(".ai-live-bar.done", {timeout: 15000});
    ok(calls === 1, "the AI was asked once");
    ok(await page.evaluate(() => Object.values(window.__sbSync.state.decks).reduce((n, d) => n + d.cards.length, 0)) === 3, "its 3 cards are saved in the deck");
    await openCreate(); await page.waitForSelector("#aiGo");
    ok(await page.inputValue("#aiPaste") === "", "the next Create with AI starts fresh");
    /* An untouched sheet isn't kept */
    await away(); await openCreate(); await page.waitForSelector("#aiGo");
    ok(await page.inputValue("#aiPaste") === "", "an empty sheet just closes");
    /* Typed text alone is kept, even with no job */
    if (!(await page.evaluate(() => document.getElementById("aiPasteD").open))) await page.click("#aiPasteD summary");
    await page.fill("#aiPaste", "half-written notes"); await page.click('#dlg .sheet-head [data-act="close"]'); await page.waitForTimeout(250);
    await openCreate(); await page.waitForTimeout(250);
    ok(await page.inputValue("#aiPaste") === "half-written notes", "✕ keeps typed text too");
    /* Another sheet opening over it sets it aside */
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "ai-setup"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector('#dlg [data-key="gemini"]'); await away();
    await openCreate(); await page.waitForTimeout(250);
    ok(await page.inputValue("#aiPaste") === "half-written notes", "a sheet that opens over it doesn't lose it");
    ok(!errs.length, "no console errors: " + errs.join(" | "));
    console.log("\nsheet-keep.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
