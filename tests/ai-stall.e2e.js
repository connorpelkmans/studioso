// node tests/ai-stall.e2e.js
// A free Gemini model that stalls on a short request: the next model gets a turn after a short wait (25s in the app, 2s here),
// the stalled one goes to the back of the line, and the next short request goes straight to a quick model.
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
const CARDS = {deckTitle: "Osmosis", cards: [{front: "What is osmosis?", back: "Water crossing a membrane toward more solute.", source: "Osmosis"}, {front: "Aquaporins?", back: "Water channels.", source: "Aquaporins"}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
    const hits = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      const m = (/models\/([^:]+):/.exec(route.request().url()) || [])[1]; hits.push(m);
      if (!ctx.stalled) ctx.stalled = m;
      if (m === ctx.stalled) { await new Promise(r => setTimeout(r, 60000)); try { await route.abort(); } catch (e) {} return; }
      await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(CARDS)}]}, finishReason: "STOP"}]})});
    });
    await ctx.addInitScript(() => {
      window.__SB_TEST = true; window.__SB_AI_STALL = 2000;
      try { if (!localStorage.getItem("sb:onboarded")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], notes: [], files: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}]})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    const make = async () => page.evaluate(async () => { const t = Date.now(); const r = await window.__sbSync.aiCall({task: "chat", maxTokens: 3000, system: "Reply with JSON.", parts: [{text: "What is my best grade so far?"}], schema: {type: "OBJECT", properties: {deckTitle: {type: "STRING"}}}}); return r && r.data ? Date.now() - t : -1; });
    const t1 = await make();
    ok(hits[0] === ctx.stalled && hits.length === 2, "the first model stalled and the next one answered: " + hits.join(", "));
    ok(t1 > 0 && t1 < 9000, `a stalled model costs a short wait, not minutes (${t1} ms)`);
    hits.length = 0;
    const t2 = await make();
    ok(hits[0] !== ctx.stalled && hits.length === 1, "the next request skips the stalled model: " + hits.join(", "));
    ok(t2 > 0 && t2 < 3000, `and answers quickly (${t2} ms)`);
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nai-stall.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
