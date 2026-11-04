// node tests/claude-structured.e2e.js
// A Claude key only ever runs as Studyboard AI does: Claude Haiku 5.5 with the thinking chosen for each job (src/js/01-ai-policy.js),
// structured outputs for the answer shape, and no tools, temperature or other model, whatever Claude model was saved before.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const TEXT = "Osmosis is the passive movement of water across a selectively permeable membrane toward the side with more solute. Aquaporins are channel proteins that let water cross faster. A red blood cell in pure water swells and can burst (lysis); in very salty water it shrivels (crenation).";
const CARDS = {deckTitle: "Osmosis", cards: [
  {front: "What is osmosis?", back: "Water passively crossing a selectively permeable membrane toward more solute.", source: "Osmosis"},
  {front: "What do aquaporins do?", back: "Let water cross the membrane faster.", source: "Aquaporins"},
  {front: "What is crenation?", back: "A cell shrivelling in a hypertonic surrounding.", source: "Tonicity"}]};
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}], decks: []};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const run = async (model, reply) => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"}); const sent = [];
    await ctx.route(/api\.anthropic\.com/, route => {
      const body = JSON.parse(route.request().postData() || "{}"); sent.push(body);
      if (/count_tokens/.test(route.request().url())) { route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({input_tokens: 2000})}); return; }
      const content = [{type: "thinking", thinking: "", signature: "x"}, {type: "text", text: reply === "fenced" ? "```json\n" + JSON.stringify(CARDS) + "\n```" : JSON.stringify(CARDS)}];
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({content, stop_reason: "end_turn", usage: {input_tokens: 1500, output_tokens: 600}})});
    });
    await ctx.addInitScript(([seed, model]) => {
      window.__SB_TEST = true;
      try {
        const s = JSON.parse(JSON.stringify(seed)); s.settings.ai = {provider: "anthropic", model};
        localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({anthropic: "sk-ant-TESTTESTTESTTESTTEST"}));
        localStorage.setItem("studyboard:aiConsent", JSON.stringify({anthropic: {v: 1, at: 1}}));
      } catch (e) {}
    }, [SEED, model]);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "fc-ai-cards"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector("#aiGo");
    if (!(await page.evaluate(() => { const d = document.getElementById("aiPasteD"); return !d || d.open; }))) await page.click("#aiPasteD summary");
    await page.fill("#aiPaste", TEXT);
    if (await page.locator("#aiCourse").count()) await page.selectOption("#aiCourse", "c1");
    await page.click("#aiGo");
    const got = await page.waitForSelector("#arSave", {timeout: 15000}).then(() => true, () => false);
    const status = got ? "" : await page.evaluate(() => (document.getElementById("aiStatus") || {}).textContent || "");
    await ctx.close();
    return {sent, got, status, errs};
  };
  try {
    const P = await import(require("url").pathToFileURL(path.join(root, "cloudflare", "ai-pro", "src", "pro.js")).href);
    for (const saved of ["claude-opus-5-5", "claude-sonnet-5", "claude-haiku-4-5-20251001", "studyboard"]) {
      const r = await run(saved, "json");
      ok(r.got, `a Claude key saved with ${saved} makes cards: ${r.status}`);
      const jobs = r.sent.filter(x => x.messages);
      ok(jobs.length && jobs.every(x => x.model === "claude-haiku-5-5"), `every request from it is Claude Haiku 5.5 (${jobs.map(x => x.model).join(", ")})`);
      const cards = jobs.find(x => JSON.stringify(x.messages).includes("Osmosis is the passive movement"));
      const want = P.buildRequest({system: "", blocks: [{type: "text", text: "x"}], task: P.taskOf("cards")});
      ok(cards && cards.output_config.effort === want.output_config.effort && cards.max_tokens === want.max_tokens && JSON.stringify(cards.thinking) === JSON.stringify(want.thinking), `with the cards job's own thinking (${want.output_config.effort}) and output cap, the same as Studyboard AI`);
      ok(jobs.every(x => !x.tools && !x.tool_choice && !("temperature" in x) && !("top_p" in x)), "no tools, forced tool calls or sampling settings");
      ok(cards && cards.output_config.format && cards.output_config.format.type === "json_schema", "the answer shape goes as structured outputs");
      ok(!r.errs.length, "no console errors: " + r.errs.join(" | "));
    }
    const r = await run("claude-opus-5-5", "fenced");
    ok(r.got, "an answer wrapped in a code fence is still read");
    console.log("\nclaude-structured.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
