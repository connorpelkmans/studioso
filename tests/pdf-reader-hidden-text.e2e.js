// node tests/pdf-reader-hidden-text.e2e.js
// A PDF with invisible oversized text over the page: dragging over a word still selects just that word
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const MODE = "open", assert = require("assert");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
const T = c => `<td style="border:1px solid #999;padding:8px">${c}</td>`;
const DOC = `<html><body style="margin:56px 64px;font-family:Arial;color:#1d1d1f"><h1>Questions</h1>
<table style="border-collapse:collapse;width:100%;font-size:14px"><tr>${T("Do we need Fusion 360 or NX instead of SOLIDWORKS?")}${T("No. Using the platform is mandatory under Section 4 of the RFP.")}</tr>
<tr>${T("How do we get the coordinates, upload them onto the drone?")}${T("Partly answered: target center coordinates are given on the day. Lead time before launch is still unknown.")}</tr>
<tr>${T("Will a representative attend the AIAA networking dinner?")}${T("Very likely. Email Florent the details.")}</tr></table>
<div style="position:absolute;left:30px;top:250px;font-size:420px;line-height:1;color:rgba(0,0,0,0.01);white-space:nowrap">Hid</div><div style="position:absolute;left:100px;top:420px;font-size:240px;line-height:1;color:rgba(0,0,0,0.01)">den</div><h2>Questions to send</h2><p>Crossbooth questions were answered by the written reply. The last column notes what is still open.</p><div style="page-break-after:always"></div><p>Page two text</p></body></html>`;
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const maker = await browser.newPage(); await maker.setContent(DOC); let ws = await maker.pdf({format: "Letter", tagged: true}); await maker.close();
  const seed = {v: 2, updated: 1, decks: [], notes: [], settings: {}, courses: [], tasks: [],
    files: [{id: "f1", name: "Worksheet.pdf", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", hl: [{id: "h1", a: "a-ws", p: 1, r: [[0.2, 0.3, 0.2, 0.02]], t: "x", c: "blue", at: 1}], revs: [{assetId: "a-ws", name: "Worksheet.pdf", size: ws.length, type: "application/pdf", at: 1}]}]};
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); } } catch (e) {} }, seed);
  const page = await ctx.newPage(); page.on("pageerror", e => console.log("ERR", e.message));
  await page.goto(base); await page.waitForFunction(() => window.__sbProStudy); await page.waitForTimeout(500);
  await page.evaluate(async b => { await window.__sbProStudy.idbSet("pdf:a-ws", new Blob([new Uint8Array(b)])); }, [...ws]);
  await page.evaluate(() => { const d = window.__sbProStudy.dlg(); if (d.open) d.close(); const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = "f1"; document.body.appendChild(b); b.click(); b.remove(); });
  await page.waitForSelector(".pdr-page .pdr-cv", {timeout: 15000}); await page.waitForTimeout(800);
  const click = id => page.evaluate(id => { const b = document.querySelector(`[data-act="pdr-zoom"][data-id="${id}"]`); b.click(); }, id);
  if (MODE === "zoom") { for (let i = 0; i < 3; i++) { await click("1"); await page.waitForTimeout(500); } }
  if (MODE === "zoomout") { for (let i = 0; i < 2; i++) { await click("-1"); await page.waitForTimeout(500); } for (let i = 0; i < 3; i++) { await click("1"); await page.waitForTimeout(300); } }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const s = [...document.querySelectorAll(".pdr-page .textLayer span")].reverse().find(s => s.textContent.includes("open.")); s.scrollIntoView({block: "end"}); });
  await page.waitForTimeout(500);
  const pt = async word => page.evaluate(word => { const s = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => !s.children.length && s.textContent.includes(word)); const tn = s.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length); const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; }, word);
  const A = await pt("still"), B = await pt("written"); if (MODE === "open") { A.x = (await pt("open.")).x - 20; A.y = (await pt("open.")).y; B.x = A.x + 40; B.y = A.y; }
  await page.mouse.move(A.x, A.y); await page.mouse.down(); await page.mouse.move(B.x, B.y, {steps: 10}); await page.mouse.up(); await page.waitForTimeout(500);
  const got = await page.evaluate(() => ({sel: String(getSelection()), tall: [...document.querySelectorAll(".pdr-page .textLayer span")].filter(x => x.getBoundingClientRect().height > 200 && !x.classList.contains("pdr-ghost")).length}));
  assert(got.tall === 0, "invisible oversized text is left out of selection"); assert(/pen/.test(got.sel) && got.sel.length < 8, "dragging over a word selects just that word: " + got.sel);
  console.log("ok - hidden oversized text can't swallow a selection");
  await browser.close(); server.close();
})();
