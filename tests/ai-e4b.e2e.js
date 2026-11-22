// node tests/ai-e4b.e2e.js: the stronger on-device AI (Gemma 4 E4B, src/js/01-ai-device.js). The model and its engine are stood in
// for (this machine has no graphics chip): a small file served with Range requests in its place, and a stand-in worker. Checks
// Studyboard's side: who's offered it, the download in parts (picked up again after a stop), switching to it when it's all there,
// what it's sent and how answers come back, and Remove.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".wasm": "application/wasm"};
const SIZE = 5 * 1024 * 1024 + 12345, PART = 1024 * 1024, FILE = Buffer.alloc(SIZE, 7);
let ranges = 0;
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/model.litertlm") {
    const m = /bytes=(\d+)-(\d+)/.exec(req.headers.range || ""); ranges++;
    if (!m) { res.writeHead(200, {"content-length": SIZE}); res.end(FILE); return; }
    const a = +m[1], b = Math.min(SIZE - 1, +m[2]); res.writeHead(206, {"content-range": `bytes ${a}-${b}/${SIZE}`, "content-length": b - a + 1}); res.end(FILE.subarray(a, b + 1)); return;
  }
  let f; try { f = path.join(ROOT, decodeURIComponent(u.pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`, b = await chromium.launch({executablePath});
  const open = async (stub, keep) => {
    const ctx = keep || await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
    await ctx.addInitScript(([s, base, size, part]) => {
      window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__asked = [];
      // a stand-in worker: answers every request with the shape it was asked for
      const worker = () => { const w = {onmessage: null, postMessage(m){ setTimeout(() => {
        if (m.t === "load") { window.__loaded = {size: m.model && m.model.size, wasm: m.wasm}; w.onmessage({data: {t: "loaded", id: m.id}}); }
        if (m.t === "ask") { window.__asked.push({system: m.system, text: m.text, schema: m.schema}); w.onmessage({data: {t: "partial", id: m.id, n: 40}}); w.onmessage({data: {t: "done", id: m.id, text: JSON.stringify({answer: "E4B ANSWER", found: true, followUps: [], actions: []})}}); }
      }, 20); }, terminate(){} }; return w; };
      window.__SB_E4B_STUB = Object.assign({worker, noBg: true, file: {url: base + "/model.litertlm", size, part, sha256: ""}}, s);
      if (s.returning && !localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]}));
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
    }, [stub, base, SIZE, PART]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(base + "/index.html"); await p.waitForFunction(() => window.SBCOMPTAB && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(1500);
    return {ctx, p};
  };
  const state = p => p.evaluate(() => { const D = window.__sbDevAI.state; return {e4b: D.e4b, kind: D.kind, status: D.status, pct: D.e4bPct, on: localStorage.getItem("studyboard:e4bOn")}; });
  const aiRow = async p => { await p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "ai-setup"; document.body.appendChild(x); x.click(); x.remove(); }); await p.waitForTimeout(400); return p.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || ""); };

  // 1. A computer that can't run it: never offered
  { const R = await open({fits: false});
    ok(!(await state(R.p)).e4b, "a computer without 16 GB or a capable graphics chip isn't offered it");
    ok(!/stronger free AI/.test(await aiRow(R.p)), "and AI Features doesn't mention it");
    await R.ctx.close(); }

  // 2. A computer that can: offered once (a note, never a blocking question), and in AI Features
  const ctx = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
  // (someone already using Studyboard: a new student is asked on Get Your Free AI Ready instead, below)
  let R = await open({fits: true, returning: true}, ctx);
  let s = await state(R.p);
  ok(s.e4b === "eligible", "a 16 GB computer with a capable graphics chip can have it: " + JSON.stringify(s));
  await R.p.waitForTimeout(4500);
  const note = await R.p.evaluate(() => (document.querySelector("#toast.show") || {}).innerText || "");
  ok(/stronger free AI/.test(note) && /Wi-Fi only/.test(note) && /Download/.test(note), "it's offered with a quiet note (size, Wi-Fi only), not a blocking question: " + note.replace(/\n/g, " "));
  ok(!(await R.p.$("dialog[open]")), "nothing blocks the page while it's offered");
  const row = await aiRow(R.p);
  ok(/This computer can run a stronger free AI/.test(row) && /Download in the Background/.test(row), "AI Features offers it too");
  // 3. Download: in parts; stopped part-way, it picks up where it stopped (no part fetched twice)
  await R.p.click('[data-e4b="get"]');
  await R.p.waitForFunction(() => window.__sbDevAI.state.e4bPct > 0.3, null, {timeout: 20000}).catch(() => {});
  await R.p.evaluate(() => localStorage.setItem("studyboard:e4bOn", "0")); await R.p.waitForTimeout(800);
  const mid = await state(R.p), r1 = ranges;
  ok(mid.pct > 0 && mid.pct < 1, "it downloads in parts: " + Math.round(mid.pct * 100) + "% before the stop");
  await R.p.close();
  R = await open({fits: true, returning: true}, ctx);
  await R.p.evaluate(() => { localStorage.setItem("studyboard:e4bOn", "1"); }); await R.p.reload(); await R.p.waitForFunction(() => window.SBCOMPTAB, null, {timeout: 30000});
  await R.p.waitForFunction(() => window.__sbDevAI.state.e4b === "ready", null, {timeout: 30000}).catch(() => {});
  s = await state(R.p);
  const parts = Math.ceil(SIZE / PART);
  ok(s.e4b === "ready" && s.kind === "litert" && s.status === "available", "next time, it finishes and switches over by itself: " + JSON.stringify(s));
  ok(ranges <= parts + 2, `no part was downloaded twice: ${ranges} requests for ${parts} parts`);
  // 4. Using it: the whole file goes to the engine, and answers come back in the shape asked for
  const ans = await R.p.evaluate(async () => { const r = await window.__sbDevAI.call({system: "Answer.", parts: [{text: "What is osmosis?"}], schema: {type: "OBJECT", properties: {answer: {type: "STRING"}}, required: ["answer"]}}); return {data: r.data, model: r.model}; });
  const L = await R.p.evaluate(() => ({loaded: window.__loaded, asked: window.__asked[0]}));
  ok(ans.data && ans.data.answer === "E4B ANSWER" && ans.model === "gemma-4-e4b", "requests go to E4B and its answer is read: " + JSON.stringify(ans));
  ok(L.loaded && L.loaded.size === SIZE, "the engine gets the whole downloaded file: " + JSON.stringify(L.loaded && L.loaded.size));
  ok(L.loaded && L.loaded.wasm.some(x => /cdn\.jsdelivr\.net\/npm\/@litert-lm\/core@0\.19\.0\/wasm/.test(x)), "its engine comes from the pinned version");
  ok(L.asked && /check every fact you use against what you were given/.test(L.asked.system) && /Answer with JSON only/.test(L.asked.system), "and it's told to check itself against what it was given");
  ok(/Stronger free AI is on/.test(await aiRow(R.p)), "AI Features says it's on, with Remove");
  // 5. Remove: the files go, and the computer goes back to what it had
  await R.p.click('[data-e4b="remove"]'); await R.p.waitForTimeout(800);
  s = await state(R.p);
  const left = await R.p.evaluate(async () => (await caches.keys()).includes("studyboard-ai-e4b"));
  ok(s.e4b === "eligible" && s.kind !== "litert" && !left, "Remove deletes it and goes back to the AI it had: " + JSON.stringify(s));
  ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
  await ctx.close();
  // 6. Get Your Free AI Ready: before Set Up Your Semester (and the first Create with AI), once; Get It Ready starts the download
  //    and the setup carries on right after
  { const c2 = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
    await c2.addInitScript(() => { window.__SB_AI_READY_TEST = true; });
    const P = await open({fits: true}, c2), p = P.p;
    await p.evaluate(() => window.SBSEM.open());
    await p.waitForSelector("dialog[open] .ai-ready-sheet", {timeout: 5000}).catch(() => {});
    const page = await p.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || "");
    ok(/Get Your Free AI Ready/.test(page) && /free AI helper that runs right on this computer/.test(page) && /in the background/.test(page) && /3\.3 GB/.test(page) && /Get It Ready/.test(page), "the setup starts with a friendly page about getting the free AI ready: " + page.replace(/\n/g, " ").slice(0, 200));
    ok(!/warning|risk|danger|large file/i.test(page), "nothing scary in it");
    await p.click('[data-ready="yes"]'); await p.waitForTimeout(800);
    const after = await p.evaluate(() => ({setup: /Set Up Your Semester/.test((document.querySelector("dialog[open]") || {}).innerText || ""), on: localStorage.getItem("studyboard:e4bOn"), st: window.__sbDevAI.state.e4b}));
    ok(after.setup && after.on === "1" && /downloading|ready/.test(after.st), "Get It Ready starts the download and goes straight on to the setup: " + JSON.stringify(after));
    await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); window.SBSEM.open({restart: true}); }); await p.waitForTimeout(500);
    ok(!(await p.$("dialog[open] .ai-ready-sheet")), "it's asked once: the next time, the setup opens straight away");
    ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
    await c2.close(); }
  // 7. Not Now: offered once more, as one line on the setup's last step, and never again
  { const c3 = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
    await c3.addInitScript(() => { window.__SB_AI_READY_TEST = true; });
    const P = await open({fits: true}, c3), p = P.p;
    await p.evaluate(() => window.SBSEM.open()); await p.waitForSelector("dialog[open] .ai-ready-sheet", {timeout: 5000}).catch(() => {});
    await p.click('[data-ready="no"]'); await p.waitForTimeout(600);
    ok(await p.evaluate(() => localStorage.getItem("studyboard:e4bOn") !== "1"), "Not Now downloads nothing");
    const week = () => p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); window.SBSEM.open(); });
    await p.evaluate(() => { const st = JSON.parse(localStorage.getItem("studyboard:semSetup") || "null"); });
    // straight to the last step
    await p.evaluate(() => { const d = document.querySelector("dialog[open]"); for (let i = 0; i < 6 && d; i++) { const n = [...d.querySelectorAll("button")].find(x => /^(Next|Skip This Step)$/.test(x.textContent.trim())); if (!n) break; n.click(); } });
    await p.waitForTimeout(800);
    let line = await p.evaluate(() => (document.querySelector(".ai-ready-line") || {}).innerText || "");
    ok(/Want the free AI helper ready/.test(line) && /Get It Ready/.test(line), "the last step offers it once more, in one line: " + line.replace(/\n/g, " "));
    await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); }); await p.reload(); await p.waitForFunction(() => window.SBSEM && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(1200);
    await p.evaluate(() => window.SBSEM.open({restart: true})); await p.waitForTimeout(500);
    ok(!(await p.$("dialog[open] .ai-ready-sheet")), "and after that the page isn't shown again");
    ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
    await c3.close(); }
  // 6. The service worker keeps the downloaded models on an update (it used to delete every cache but its own)
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  ok(/caches\.delete\(k\)/.test(sw) && /\^\(studyboard\|studioso\)-v\\d\+\$/.test(sw), "an app update clears only the app's own old caches, never a downloaded model");
  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
