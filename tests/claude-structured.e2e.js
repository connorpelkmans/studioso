// node tests/claude-structured.e2e.js
// Structured answers from Claude: newer models (Opus 5.5, Sonnet 5.5, Fable 5.1) refuse a forced tool call with a 400,
// so they get tool_choice auto plus an instruction; older ones keep the forced call. Both answer shapes are read.
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
      const forcedBad = /^claude-(opus-5-5|sonnet-5-5|fable-5-1)/.test(body.model) && body.tool_choice && /^(tool|any)$/.test(body.tool_choice.type);
      if (forcedBad) { route.fulfill({status: 400, contentType: "application/json", body: JSON.stringify({type: "error", error: {type: "invalid_request_error", message: "tool_choice: type \"tool\" and \"any\" are not supported for this model."}})}); return; }
      const content = reply === "text" ? [{type: "thinking", thinking: "", signature: "x"}, {type: "text", text: "Here you go:\n" + JSON.stringify(CARDS)}]
        : [{type: "thinking", thinking: "", signature: "x"}, {type: "tool_use", id: "t1", name: "answer", input: CARDS}];
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({content, stop_reason: reply === "text" ? "end_turn" : "tool_use"})});
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
    let r = await run("claude-opus-5-5", "tool");
    const b = r.sent[r.sent.length - 1];
    ok(r.got, "Opus 5.5 makes cards (was a 400 before): " + r.status);
    ok(r.sent.every(x => x.tool_choice && x.tool_choice.type === "auto"), "Opus 5.5 gets tool_choice auto, never a forced tool");
    ok(/calling the answer tool/.test(b.system) && b.tools.some(t => t.name === "answer"), "and is told to answer with the answer tool, which is offered");
    ok(!r.errs.length, "no console errors: " + r.errs.join(" | "));
    r = await run("claude-opus-5-5", "text");
    ok(r.got, "if Opus 5.5 answers in plain text instead, the JSON is still read: " + r.status);
    r = await run("claude-sonnet-5", "tool");
    ok(r.got && r.sent.every(x => x.tool_choice && x.tool_choice.type === "tool" && x.tool_choice.name === "answer"), "Sonnet 5 keeps the forced answer tool");
    ok(!/calling the answer tool/.test(r.sent[0].system), "and its system prompt is unchanged");
    r = await run("claude-haiku-4-5-20251001", "tool");
    ok(r.got && r.sent[0].tool_choice.type === "tool", "Haiku 4.5 keeps the forced answer tool");
    console.log("\nclaude-structured.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
