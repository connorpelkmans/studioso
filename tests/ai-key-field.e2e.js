// node tests/ai-key-field.e2e.js
// AI keys are typed into masked text boxes, not password fields, so browsers don't offer to save or update a password
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 900, height: 900}});
    await ctx.addInitScript(() => { try { if (!localStorage.getItem("sb:onboarded")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaSyD-abcdefghijklmnopqrstuvwxyz_0123"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(800);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "ai-setup"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector('#dlg[open] [data-key="gemini"]');
    const info = await page.evaluate(() => [...document.querySelectorAll("#dlg [data-key]")].map(i => ({type: i.type, mask: getComputedStyle(i).webkitTextSecurity, ac: i.autocomplete, pw: i.closest("form") ? i.closest("form").querySelectorAll('input[type="password"]').length : 0})));
    ok(info.length >= 1 && info.every(x => x.type === "text"), "no key box is a password field: " + JSON.stringify(info.map(x => x.type)));
    ok(info.every(x => x.mask === "disc"), "every key is still shown as dots");
    ok(info.every(x => x.ac === "off" && x.pw === 0), "autocomplete is off and the form has no password field for a password manager to pick up");
    ok(await page.inputValue('[data-key="gemini"]') === "AIzaSyD-abcdefghijklmnopqrstuvwxyz_0123", "the saved key is filled in");
    await page.click('[data-show="gemini"]');
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('[data-key="gemini"]')).webkitTextSecurity) === "none" && await page.textContent('[data-show="gemini"]') === "Hide", "Show reveals the key");
    await page.click('[data-show="gemini"]');
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('[data-key="gemini"]')).webkitTextSecurity) === "disc" && await page.textContent('[data-show="gemini"]') === "Show", "Hide masks it again");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nai-key-field.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
