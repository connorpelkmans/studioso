// node tests/link-fail-visible.e2e.js: when Gemini answers but couldn't watch the video, the message is on screen and the companion
// says it didn't work (it used to say "Finished!" while the message sat below the fold)
// Cards From a Link: a YouTube video (Gemini file_data) or a web page (url context / web fetch) becomes draft cards through the usual
// review step and a summary note that credits the source. Gemini and Claude are mocked.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const VIDEO_NOTES = {status: "ok", title: "Osmosis and Tonicity: Crash Course Biology #27",
  overview: "The video explains how water crosses cell membranes by osmosis and how the solute concentration outside a cell decides whether it swells, shrinks or stays the same.",
  sections: [{heading: "Osmosis", points: ["Osmosis is the passive movement of water across a selectively permeable membrane", "Water moves toward the side where solute is more concentrated", "No ATP is used because water moves down its own gradient"]},
    {heading: "Tonicity", points: ["A hypertonic surrounding draws water out, so an animal cell shrivels (crenation)", "A hypotonic surrounding lets water flood in, so a red blood cell can burst (lysis)", "Plant cells in hypotonic water become turgid because the cell wall stops them bursting"]},
    {heading: "Aquaporins", points: ["Aquaporins are channel proteins that let water cross much faster than through the bilayer alone"]}],
  terms: [{term: "Osmosis", definition: "The passive movement of water across a selectively permeable membrane toward more solute"}, {term: "Hypertonic", definition: "Having a higher solute concentration than the cell"}, {term: "Lysis", definition: "A cell bursting after taking in too much water"}]};
const PAGE_NOTES = {status: "ok", title: "Active transport | Khan Academy",
  overview: "The article describes how cells move substances against their concentration gradients using energy, with the sodium potassium pump as the main example.",
  sections: [{heading: "Primary active transport", points: ["Primary active transport uses ATP directly to move ions against their gradient", "The sodium potassium pump moves three sodium ions out and two potassium ions in per ATP"]},
    {heading: "Secondary active transport", points: ["Secondary active transport uses an existing ion gradient instead of ATP", "Symporters move two substances the same way; antiporters move them in opposite directions"]}],
  terms: [{term: "Antiporter", definition: "A carrier protein that moves two substances in opposite directions"}]};
const CARDS = {deckTitle: "Osmosis and Tonicity", cards: [
  {front: "What is osmosis?", back: "Water passively crossing a selectively permeable membrane toward more solute.", source: "Osmosis"},
  {front: "Which way does water move in osmosis?", back: "Toward the side with the higher solute concentration.", source: "Osmosis"},
  {front: "What happens to an animal cell in a hypertonic surrounding?", back: "It loses water and shrivels (crenation).", source: "Tonicity"},
  {front: "What is lysis?", back: "A cell bursting after taking in too much water.", source: "Key Terms"},
  {front: "What do aquaporins do?", back: "They are channel proteins that let water cross the membrane much faster.", source: "Aquaporins"}]};
const PAGE_CARDS = {deckTitle: "Active Transport", cards: [
  {front: "What does primary active transport use?", back: "ATP, directly.", source: "Primary active transport"},
  {front: "What does the sodium potassium pump move per ATP?", back: "Three sodium ions out and two potassium ions in.", source: "Primary active transport"},
  {front: "What is an antiporter?", back: "A carrier protein moving two substances in opposite directions.", source: "Key Terms"}]};
const TRANSCRIPT = `Hi, I'm Hank and this is Crash Course Biology. Today: osmosis. Imagine a membrane that lets water through but not salt. Water is going to move toward wherever the salt is more concentrated, and it does that without the cell spending any ATP.
If you drop a red blood cell into pure water, water floods in and the cell can actually burst. Biologists call that lysis. Put the same cell in very salty water and it shrivels up, which is called crenation. Plant cells have a wall, so in fresh water they just get firm, or turgid.
Water does sneak through the lipid bilayer a little, but most of it goes through special channel proteins called aquaporins, which are way faster.`;
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], settings: {capacity: 15}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Chemistry", code: "CHEM110", color: "#E07A3B"}],
  decks: [{id: "d1", name: "BIO101 Membranes", courseId: "c1", created: 1, quizzes: [], cards: [{id: "k1", front: "Bilayer", back: "Two layers of phospholipids", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}]};
const gem = (text, extra) => ({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [Object.assign({content: {parts: [{text}]}, finishReason: "STOP"}, extra || {})]})});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1381, height: 961}, serviceWorkers: "block", colorScheme: "dark"});
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      const body = route.request().postData() || "";
      await new Promise(r => setTimeout(r, 1200));
      try { route.fulfill(gem(/file_uri/.test(body) ? JSON.stringify({status: "unreachable"}) : /small, cute study companion/.test(body) ? JSON.stringify({line: "hi"}) : JSON.stringify(CARDS))); } catch (e) {}
    });
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbSync && window.SBLINKCARDS && window.SBCOMP); await page.waitForTimeout(500);
    await page.evaluate(() => SBCOMP.open()); await page.waitForSelector("dialog[open] .cp-tile"); await page.click('dialog[open] .cp-tile [data-act="comp-pick"]'); await page.waitForTimeout(400); await page.keyboard.press("Escape"); await page.waitForTimeout(500);
    await page.evaluate(() => { window.__cpSaid = []; new MutationObserver(() => { const t = document.querySelector(".cp-bubble.on .cp-b-t"); if (t && t.textContent && window.__cpSaid[window.__cpSaid.length - 1] !== t.textContent) window.__cpSaid.push(t.textContent); }).observe(document.body, {subtree: true, childList: true, characterData: true}); });
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "fc-ai"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForSelector("#aiGo");
    if (!(await page.evaluate(() => document.getElementById("aiLinkD").open))) await page.click("#aiLinkD summary");
    await page.fill("#aiLink", "https://www.youtube.com/watch?v=ESABTN4VtrA");
    await page.evaluate(() => { const b = document.getElementById("aiQuiz"); if (b && !b.checked) b.click(); document.querySelector("#dlg .sheet-body").scrollTop = 0; });
    await page.click("#aiGo");
    await page.waitForFunction(() => /couldn't watch that video/.test((document.getElementById("aiStatus") || {}).textContent || ""), null, {timeout: 15000});
    await page.waitForTimeout(2500);
    const vis = await page.evaluate(() => { const s = document.getElementById("aiStatus"), b = s.closest(".sheet-body").getBoundingClientRect(), r = s.getBoundingClientRect(); return r.top >= b.top - 1 && r.bottom <= b.bottom + 1; });
    ok(vis, "the message is scrolled into view inside the sheet: " + await page.textContent("#aiStatus"));
    const said = await page.evaluate(() => window.__cpSaid);
    ok(!said.some(t => /All done|Ta-da|Finished|Done and done/.test(t)) && said.some(t => /didn't work|got stuck/.test(t)), "the companion says it didn't work, not that it's finished: " + JSON.stringify(said));
    ok(!errs.length, "no page errors " + errs.join(" | "));
    await ctx.close();
    // The video never reached Gemini (a few hundred tokens read, an "empty" answer in no time): one plain retry
    for (const mode of ["plain-works", "never"]) {
      const c2 = await browser.newContext({viewport: {width: 1381, height: 961}, serviceWorkers: "block"}); const bodies = [];
      await c2.route(/generativelanguage\.googleapis\.com/, async route => {
        const body = route.request().postData() || ""; if (/file_uri/.test(body)) bodies.push(JSON.parse(body));
        const vid = /file_uri/.test(body), plain = vid && !/mime_type/.test(body);
        const seen = vid && mode === "plain-works" && plain;
        const usage = {usageMetadata: {promptTokenCount: seen ? 42000 : 600}};
        const res = gem(vid ? JSON.stringify(seen ? VIDEO_NOTES : {status: "empty"}) : /small, cute study companion/.test(body) ? JSON.stringify({line: "hi"}) : JSON.stringify(CARDS));
        if (vid) res.body = JSON.stringify(Object.assign(JSON.parse(res.body), usage));
        try { route.fulfill(res); } catch (e) {}
      });
      await c2.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, SEED);
      const p2 = await c2.newPage(); const e2 = []; p2.on("pageerror", e => e2.push(e.message));
      await p2.goto(base); await p2.waitForFunction(() => window.__sbSync && window.SBLINKCARDS);
      await p2.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "fc-ai"; document.body.appendChild(b); b.click(); b.remove(); }); await p2.waitForSelector("#aiGo");
      if (!(await p2.evaluate(() => document.getElementById("aiLinkD").open))) await p2.click("#aiLinkD summary");
      await p2.fill("#aiLink", "https://www.youtube.com/watch?v=ESABTN4VtrA"); await p2.click("#aiGo");
      if (mode === "plain-works") {
        await p2.waitForFunction(() => /Review Before Saving/.test((document.querySelector("#dlg[open]") || {}).textContent || ""), null, {timeout: 15000}).catch(() => {});
        ok(/Review Before Saving/.test(await p2.evaluate(() => (document.querySelector("#dlg[open]") || {}).textContent || "")), "when the video didn't reach Gemini, one plain retry gets it, and the cards come through");
        ok(bodies.length === 2 && bodies[0].contents[0].parts[0].file_data.mime_type && !bodies[1].contents[0].parts[0].file_data.mime_type && !bodies[1].contents[0].parts[0].video_metadata, "the retry sends just the link (no file type, no frame rate)");
      } else {
        await p2.waitForFunction(() => /didn't get the video itself/.test((document.getElementById("aiStatus") || {}).textContent || ""), null, {timeout: 15000}).catch(() => {});
        ok(/didn't get the video itself/.test(await p2.textContent("#aiStatus")) && bodies.length === 2, "when it never arrives, the message says Gemini didn't get the video: " + await p2.textContent("#aiStatus"));
      }
      ok(!e2.length, mode + ": no page errors " + e2.join(" | "));
      await c2.close();
    }
    console.log("\nlink-fail-visible.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
