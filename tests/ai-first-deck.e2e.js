// node tests/ai-first-deck.e2e.js: the app side of the free first deck (src/js/01-ai-first.js). With the AI on this device, a new
// student's first flashcards come from Studyboard's cloud AI (stood in for here), once; after that, and whenever the cloud says no,
// the device makes them. The sheet says so, with a way to keep it on the computer.
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
const NOTES = "Glycolysis splits glucose into two pyruvate in the cytoplasm and makes a little ATP and NADH. It needs no oxygen. The Krebs cycle runs in the mitochondrial matrix and releases carbon dioxide. The electron transport chain on the inner membrane uses oxygen to make most of the ATP.";
function fakeChrome(){
  window.__devLog = {prompts: 0};
  window.LanguageModel = {availability: async () => "available", create: async () => ({contextWindow: 6000, contextUsage: 100, destroy(){},
    async prompt(input, po){ window.__devLog.prompts++; const sch = JSON.stringify(po.responseConstraint || {});
      if (/"facts"/.test(sch)) return JSON.stringify({facts: ["Glycolysis splits glucose into two pyruvate in the cytoplasm."]});
      if (/"basis"/.test(sch) || /"cards"/.test(sch)) return JSON.stringify({deckTitle: "Device", cards: [{basis: "Glycolysis splits glucose into two pyruvate in the cytoplasm", front: "Where does glycolysis happen (device)?", back: "In the cytoplasm."}]});
      if (/"answers"/.test(sch)) return JSON.stringify({answers: []});
      return JSON.stringify({answer: "ok"}); }})};
}
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const open = async (reply, pre) => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"}), hits = [];
    await ctx.route(/ai\.studyboardapp\.com\/v1\/first-deck/, async r => { const req = r.request(); if (req.method() === "OPTIONS") return r.fulfill({status: 204, headers: {"access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST"}});
      hits.push(JSON.parse(req.postData() || "{}")); const x = reply(hits.length); await r.fulfill({status: x.s, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(x.j)}); });
    await ctx.addInitScript(([fake, pre]) => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__SB_FIRST_TEST = true; (0, eval)(`(${fake})`)();
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]}));
      Object.entries(pre || {}).forEach(([k, v]) => localStorage.setItem(k, v)); }, [fakeChrome.toString(), pre]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.__sbDevAI, null, {timeout: 20000}); await p.waitForTimeout(300);
    return {ctx, p, hits};
  };
  const sheet = async p => { await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); }); await p.waitForSelector("#dlg[open] #aiGo"); };
  const make = async p => {
    await p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, NOTES);
    await p.evaluate(() => { const q = document.querySelector("#aiQuiz"); if (q && q.checked) q.click(); });
    await p.click("#aiGo"); await p.waitForSelector("dialog[open] #arSave", {timeout: 30000}).catch(() => {});
    return p.evaluate(() => ({fronts: [...document.querySelectorAll('#arCards [data-f="front"]')].map(x => x.value), all: (document.querySelector("dialog[open]") || {}).innerText || "", prompts: window.__devLog.prompts}));
  };
  const CLOUD = {s: 200, j: {deckTitle: "Cellular Respiration", cards: [{front: "Where does glycolysis take place?", back: "In the cytoplasm."}, {front: "Which stage uses oxygen to make most ATP?", back: "The electron transport chain."}]}};

  // 1. A new student: the sheet says so, and the first set comes from the cloud
  { const R = await open(() => CLOUD); await sheet(R.p);
    const t = await R.p.evaluate(() => document.querySelector("dialog[open]").innerText);
    ok(/first set is made free by Studyboard's cloud AI/.test(t) && /aren't kept/.test(t) && /Use My Computer Instead/.test(t), "the sheet says the first set is made in the cloud, that notes aren't kept, and offers the computer instead");
    const out = await make(R.p);
    ok(R.hits.length === 1 && R.hits[0].text.includes("Glycolysis splits glucose") && typeof R.hits[0].course === "string" && /^[A-Za-z0-9_-]{8,}$/.test(R.hits[0].device), "the notes, course and a device code go to Studyboard's server: " + JSON.stringify({c: R.hits[0] && R.hits[0].course, d: R.hits[0] && R.hits[0].device}));
    ok(out.fronts.some(f => /Where does glycolysis take place/.test(f)), "the cloud's cards are the ones to review: " + out.fronts.join(" | "));
    ok(!out.fronts.some(f => /\(device\)/.test(f)) && out.prompts === 0, "and the device's AI wasn't used for them");
    ok(/made free by Studyboard's cloud AI, as a first set/.test(out.all), "the review says where they came from");
    await R.p.evaluate(() => document.querySelector("dialog[open]").close());
    await sheet(R.p);
    ok(!/cloud AI/.test(await R.p.evaluate(() => document.querySelector("dialog[open]").innerText)), "the next sheet doesn't offer it again");
    const two = await make(R.p);
    ok(R.hits.length === 1 && two.fronts.some(f => /\(device\)/.test(f)), "and the next set is made on the device");
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 2. The free allowance is used up today: the device makes it, without a word
  { const R = await open(() => ({s: 429, j: {error: "full"}})); await sheet(R.p); const out = await make(R.p);
    ok(R.hits.length === 1 && out.fronts.some(f => /\(device\)/.test(f)), "when the cloud says no, the device makes the set");
    ok(!/cloud AI/.test(out.all) && !/error|full/i.test(out.all.split("\n").slice(0, 3).join(" ")), "with nothing said about it");
    await R.p.evaluate(() => document.querySelector("dialog[open]").close()); await sheet(R.p);
    ok(/cloud AI/.test(await R.p.evaluate(() => document.querySelector("dialog[open]").innerText)), "it's offered again next time (up to 3 tries)");
    await R.ctx.close(); }

  // 3. A device that already had one (the server says so): not asked again
  { const R = await open(() => ({s: 409, j: {error: "used"}})); await sheet(R.p); await make(R.p);
    ok(await R.p.evaluate(() => localStorage.getItem("sb-first-deck") === "1"), "a device the server already gave one is marked done");
    await R.ctx.close(); }

  // 4. Use My Computer Instead: nothing is sent
  { const R = await open(() => CLOUD); await sheet(R.p);
    await R.p.click("[data-act=ai-first-skip]");
    ok(!(await R.p.$(".ai-first-note")), "the note goes away");
    const out = await make(R.p);
    ok(R.hits.length === 0 && out.fronts.some(f => /\(device\)/.test(f)), "and the set is made on the computer, nothing sent");
    await R.ctx.close(); }

  // 5. With a key of their own, or after 3 tries, it's never used
  { const R = await open(() => CLOUD, {"sb-first-tries": "3"}); await sheet(R.p); await make(R.p);
    ok(R.hits.length === 0, "after 3 tries it isn't offered again"); await R.ctx.close(); }
  { const R = await open(() => CLOUD, {"studyboard:aiKeys": JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}), "studyboard:aiConsent": JSON.stringify({gemini: {v: 1, at: 1}})});
    await sheet(R.p); ok(!/cloud AI/.test(await R.p.evaluate(() => document.querySelector("dialog[open]").innerText)), "a student with their own key never sees it"); await R.ctx.close(); }

  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
