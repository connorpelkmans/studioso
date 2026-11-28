// node tests/ai-key-delete.e2e.js
// Deleting the only AI key (select it, Backspace, Save) removes it from this device: it doesn't come back when AI settings reopen.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const KEY = "AIzaTESTTESTTESTTESTTESTTEST12345";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(k => {
      window.__SB_TEST = true;
      if (localStorage.getItem("coursework:v2")) return;
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], settings: {capacity: 15, ai: {provider: "gemini", model: "auto"}}, courses: [], decks: []}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: k}));
      localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
    }, KEY);
    const page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    const openAi = () => page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.createElement("button"); b.dataset.act = "ai-setup"; document.body.appendChild(b); b.click(); b.remove(); });
    const noKey = () => page.evaluate(() => [...document.querySelectorAll("#dlg [data-key]")].every(i => !i.value));
    await openAi(); await page.waitForSelector('#dlg[open] [data-key="gemini"]');
    ok(await page.inputValue('#dlg [data-key="gemini"]') === KEY, "the saved Gemini key shows in AI settings");
    await page.click('#dlg [data-key="gemini"]'); await page.keyboard.press("ControlOrMeta+A"); await page.keyboard.press("Backspace");
    ok(await page.inputValue('#dlg [data-key="gemini"]') === "", "selected and deleted");
    await page.click("#aiSave"); await page.waitForFunction(() => !document.querySelector("#dlg[open] #aiSave"), null, {timeout: 5000}); await page.waitForTimeout(300);
    ok(!String(await page.evaluate(() => localStorage.getItem("studyboard:aiKeys"))).includes(KEY), "after Save it's gone from this device");
    await openAi(); await page.waitForSelector('#dlg[open] [data-key="gemini"]', {state: "attached"});
    ok(await noKey(), "and AI settings reopen without it");
    await page.reload(); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    await openAi(); await page.waitForSelector('#dlg[open] [data-key="gemini"]', {state: "attached"});
    ok(await noKey() && !(await page.evaluate(() => localStorage.getItem("studyboard:aiKeys"))), "and it stays gone after reloading");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nai-key-delete.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e.message.split("\n")[0]); process.exit(1); });
