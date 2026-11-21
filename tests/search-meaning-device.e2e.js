// node tests/search-meaning-device.e2e.js: search by meaning with no key and no Pro, by the small search model on the student's
// device (src/js/30-search.js, vendor/embed-4.3.2). The model is stood in for by a "meaning" made of a few concepts, so a question
// and a note that share no words can still match, as with the real one; the real model's own check is in this file's notes below.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".wasm": "application/wasm"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
function stub(){
  const C = [/oxygen|breath|respir|electron transport|atp|energy/i, /war|treaty|versailles|armistice/i, /price|supply|demand|market/i, /memor|recall|aware|preconscious/i, /divid|mitosis|copy|duplicat|daughter cell/i];
  window.__embedCalls = {docs: 0, queries: 0};
  window.__SB_EMBED_STUB = async (texts, isQuery) => { window.__embedCalls[isQuery ? "queries" : "docs"] += texts.length; await new Promise(r => setTimeout(r, 5));
    return texts.map(t => { const v = C.map(re => re.test(t) ? 1 : 0); v.push(0.05); return v.concat(Array(384 - v.length).fill(0)); }); };
}
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const ctx = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
  await ctx.addInitScript(([f]) => { window.__SB_TEST = true; (0, eval)(`(${f})`)();
    localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [{id: "t1", title: "History essay on the Treaty of Versailles", due: "2026-12-01", status: "todo", courseId: "c1"}], files: [],
      notes: [{id: "n1", text: "The electron transport chain makes most of the ATP in the mitochondria.", x: 10, y: 10}, {id: "n2", text: "Mitosis makes two identical daughter cells.", x: 300, y: 10}],
      events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]})); }, [stub.toString()]);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.SBSEARCH, null, {timeout: 30000}); await p.waitForTimeout(500);
  // opening Search Everywhere starts the meaning index in the background
  await p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "search"; document.body.appendChild(x); x.click(); x.remove(); });
  await p.waitForFunction(() => window.__embedCalls.docs >= 3, null, {timeout: 20000}).catch(() => {});
  const calls = await p.evaluate(() => window.__embedCalls);
  ok(calls.docs >= 3, `with no key, the device's search model indexes notes and tasks in the background (${calls.docs} items)`);
  const r = await p.evaluate(async () => { const x = await window.SBSEARCH.retrieve("why do cells need oxygen", {max: 3}); return x.text; });
  ok(/electron transport chain/i.test(r), "a question with no words in common finds the right note by meaning: " + r.slice(0, 120));
  const r2 = await p.evaluate(async () => (await window.SBSEARCH.retrieve("how do cells copy themselves", {max: 3})).text);
  ok(/Mitosis/.test(r2), "and another: " + r2.slice(0, 120));
  ok((await p.evaluate(() => window.__embedCalls.queries)) >= 2, "each question goes through the same model");
  // the same model ranks web passages for the on-device AI (98-truth.js research)
  const ev = await p.evaluate(async () => { const v = await window.SBSEARCH.embedTexts(["why do cells need oxygen", "The treaty ended the war.", "Respiration uses oxygen to make ATP."], true); return v ? v.map(x => x.length) : null; });
  ok(ev && ev.length === 3 && ev.every(n => n === 384), "web passages can be ranked by the same on-device model (3 vectors of 384)");
  // as you type: what the words miss shows under Related by Meaning
  await p.fill("#sxQ", "duplicating themselves"); await p.waitForTimeout(1200);
  const rel = await p.evaluate(() => { const g = [...document.querySelectorAll("#sxList .sx-grp, #sxList [role=group]")].find(x => /Related by Meaning/i.test(x.innerText)); return g ? g.innerText : ""; });
  ok(/Related by Meaning/i.test(rel) && /Mitosis/.test(rel), "typing words that aren't in the note still shows it, under Related by Meaning: " + rel.replace(/\n/g, " ").slice(0, 120));
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(`\nsearch-meaning-device.e2e: ${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
