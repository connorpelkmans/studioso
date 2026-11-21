// node tests/ai-device-speed.e2e.js: the AI on the student's own computer is quick enough to use (01-ai-device.js, 01-ai.js).
// Chrome's model is stood in for, so these check Studyboard's side: the model gets ready while the sheet is open, the long card
// instructions are read once and copied for each part (clone), a long set is a few big parts with about 30 cards, the student sees
// the answer being written, Chrome's one-time download says so, and the Model row names the AI instead of an empty menu.
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
const TOPICS = ["Glycolysis", "Krebs Cycle", "Electron Transport", "Fermentation", "Photosynthesis", "Calvin Cycle"];
const NOTES = TOPICS.map(t => `## ${t}\n` + Array.from({length: 30}, (_, i) => `${t} fact ${i + 1} says that the ${t.toLowerCase()} step number ${i + 1} moves energy carriers inside the cell during respiration.`).join(" ")).join("\n\n");
function fake(o){
  const log = window.__log = {creates: [], clones: 0, prompts: [], streamed: 0};
  let status = o.status;
  const session = system => ({contextWindow: 9000, contextUsage: Math.ceil(system.length / 4), destroy(){},
    async clone(){ log.clones++; return session(system); },
    async prompt(input, po){ return answer(system, input, po); },
    promptStreaming(input, po){ log.streamed++; const full = answer(system, input, po); return (async function* (){ const s = await full; for (let i = 0; i < s.length; i += 40) { await new Promise(r => setTimeout(r, 15)); yield s.slice(i, i + 40); } })(); }});
  async function answer(system, input, po){
    const text = input.map(m => m.content.map(c => c.value).join("\n")).join("\n"); log.prompts.push({system: system.slice(0, 60), text});
    await new Promise(r => setTimeout(r, 40));
    const want = Number((/Make exactly (\d+)/.exec(text) || [])[1]) || 3, sents = (text.match(/[A-Z][a-z ]+ fact \d+ says[^.]*\./g) || []).slice(0, want);
    const W = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "theta", "kappa", "lambda", "sigma"];
    return JSON.stringify({deckTitle: "Respiration", cards: sents.map((s0, i) => ({basis: s0.split(" ").slice(0, 6).join(" "), front: `Which ${W[i % 10]} detail does ${s0.split(" fact")[0]} describe about ${W[(i + 3) % 10]} carriers?`, back: `The ${W[(i + 5) % 10]} ${W[(i + 7) % 10]} movement of energy carriers.`}))});
  }
  window.LanguageModel = {availability: async () => status,
    create: async c => { const system = ((c && c.initialPrompts) || [])[0] ? c.initialPrompts[0].content : ""; log.creates.push({system: system.slice(0, 60), len: system.length, monitor: !!(c && c.monitor)});
      if (status !== "available") { const m = new EventTarget(); if (c && c.monitor) c.monitor(m); for (const x of [0.2, 0.5]) { await new Promise(r => setTimeout(r, 400)); const e = new Event("downloadprogress"); e.loaded = x; m.dispatchEvent(e); } await new Promise(r => setTimeout(r, 1500)); const e = new Event("downloadprogress"); e.loaded = 1; m.dispatchEvent(e); status = "available"; }
      return session(system); }};
}
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const open = async o => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(([f, o]) => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; (0, eval)(`(${f})`)(o);
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"})); localStorage.setItem("sb-first-deck", "1");
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]})); }, [fake.toString(), o]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(400);
    return {ctx, p};
  };
  const sheet = p => p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); });

  { const R = await open({status: "available"});
    await sheet(R.p); await R.p.waitForSelector("#dlg[open] #aiGo"); await R.p.waitForTimeout(500);
    const bar = await R.p.evaluate(() => { const b = document.querySelector("#dlg[open] .ai-model-bar"); return {text: b ? b.innerText : "", select: !!(b && b.querySelector("select"))}; });
    ok(/Free AI, runs on your computer: Chrome's built-in AI/.test(bar.text) && !bar.select, "the Model row names the AI on this computer, with no empty menu: " + bar.text.replace(/\n/g, " "));
    const warm = await R.p.evaluate(() => window.__log.creates.filter(c => /^You make flashcards/.test(c.system)).length);
    ok(warm === 1, "opening the sheet gets the model ready with the card instructions, before Create is pressed");
    const est0 = await R.p.evaluate(() => { const e = document.querySelector("#aiEst"); return e && !e.hidden ? e.textContent : ""; });
    ok(/first set shows how fast/.test(est0), "before any set, the sheet says the first one shows this computer's speed: " + est0);
    await R.p.evaluate(() => { window.__liveBefore = 0; new MutationObserver(() => { if (!document.querySelector("#arSave")) window.__liveBefore = Math.max(window.__liveBefore, document.querySelectorAll(".ai-live-card").length); }).observe(document.body, {subtree: true, childList: true}); });
    await R.p.evaluate(() => { window.__status = []; const s = document.querySelector("#aiStatus"); new MutationObserver(() => window.__status.push(s.textContent)).observe(s, {childList: true, subtree: true, characterData: true}); });
    await R.p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, NOTES);
    await R.p.evaluate(() => { const q = document.querySelector("#aiQuiz"); if (q && q.checked) q.click(); });
    const t0 = Date.now(); await R.p.click("#aiGo"); await R.p.waitForSelector("dialog[open] #arSave", {timeout: 60000}).catch(() => {});
    const L = await R.p.evaluate(() => ({creates: window.__log.creates.filter(c => /^You make flashcards/.test(c.system)).length, clones: window.__log.clones, parts: window.__log.prompts.filter(x => /^You make flashcards/.test(x.system)).length,
      asked: window.__log.prompts.filter(x => /^You make flashcards/.test(x.system)).reduce((m, x) => m + (Number((/Make exactly (\d+)/.exec(x.text) || [])[1]) || 0), 0), facts: window.__log.prompts.filter(x => /^You list the facts/.test(x.system)).length,
      cards: document.querySelectorAll("#arCards li").length, status: window.__status}));
    ok(L.parts >= 2 && L.parts <= 8, `about 2,700 words go in a few big parts, not a dozen small ones: ${L.parts}`);
    ok(L.creates === 1 && L.clones >= L.parts, `the card instructions are read once and copied for each part: ${L.creates} session, ${L.clones} copies ` + JSON.stringify(await R.p.evaluate(() => window.__log.creates)));
    ok(L.asked <= 32 && L.cards >= L.parts, `"Auto" asks for about 30 cards in all (${L.asked}), and they come back (${L.cards})`);
    ok(L.facts === 0, "cards alone take one request a part (no separate list of facts)");
    ok(L.status.some(s => /writing \d+ words?/.test(s)), "the student sees the answer being written: " + (L.status.find(s => /writing/.test(s)) || "none"));
    ok(L.status.some(s => /\d+ cards? so far, part \d+ of \d+/.test(s)), "and how many cards are done: " + (L.status.find(s => /cards? so far/.test(s)) || "none"));
    const live = await R.p.evaluate(() => window.__liveBefore);
    ok(live >= 3, `cards show up to study while the rest are made (${live} before Review opened)`);
    // the next time, the sheet says how long it takes on this computer, for what's picked
    await R.p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await sheet(R.p); await R.p.waitForSelector("#dlg[open] #aiGo");
    const est1 = await R.p.evaluate(() => (document.querySelector("#aiEst") || {}).textContent || "");
    ok(/^On this computer: .+ for Auto flashcards/.test(est1), "after a set, the sheet estimates the next one on this computer: " + est1);
    await R.p.evaluate(() => { const s = JSON.parse(localStorage.getItem("studyboard:devSpeed")); s.card.per = 9; localStorage.setItem("studyboard:devSpeed", JSON.stringify(s)); const r = document.querySelector('input[name=aiCardN][value="50"]'); r.checked = true; r.dispatchEvent(new Event("change", {bubbles: true})); });
    const est2 = await R.p.evaluate(() => (document.querySelector("#aiEst") || {}).textContent || "");
    ok(/for 50 flashcards/.test(est2) && /long wait here: Auto \(about 30 cards\) is quicker/.test(est2) && /tap outside this window/.test(est2), "a long one says so, points to Auto and to finishing in the background: " + est2);
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // Chrome stops sending in the middle of an answer: the request is dropped and asked again on a fresh session, so the set finishes
  { const R = await open({status: "available"});
    await R.p.evaluate(() => { window.__SB_STALL_MS = 1500; window.__stalled = 0; const LM = window.LanguageModel, create = LM.create;
      LM.create = async c => { const s = await create(c), clone = s.clone.bind(s); s.clone = async () => { const k = await clone(); const ps = k.promptStreaming.bind(k);
        k.promptStreaming = (inp, po) => { if (window.__stalled++ === 0) return (async function* (){ yield "{\"deckTitle\": \"R"; await new Promise(r => setTimeout(r, 600000)); })(); return ps(inp, po); }; return k; }; return s; }; });
    await sheet(R.p); await R.p.waitForSelector("#dlg[open] #aiGo");
    await R.p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, NOTES.slice(0, 1500));
    await R.p.evaluate(() => { const q = document.querySelector("#aiQuiz"); if (q && q.checked) q.click(); });
    await R.p.click("#aiGo"); await R.p.waitForSelector("dialog[open] #arSave", {timeout: 30000}).catch(() => {});
    const got = await R.p.evaluate(() => ({cards: document.querySelectorAll("#arCards li").length, stalled: window.__stalled}));
    ok(got.cards >= 1 && got.stalled >= 1, `a stalled answer is retried and the set still comes back: ${got.cards} cards`);
    await R.ctx.close(); }

  // Chrome's one-time download: a message at the bottom says so with its progress, from the first AI button
  { const R = await open({status: "downloadable"});
    await sheet(R.p); await R.p.waitForSelector("#dlg[open] #aiGo");
    await R.p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, NOTES.slice(0, 1200));
    await R.p.click("#aiGo");
    await R.p.waitForFunction(() => { const e = document.getElementById("devDlPill"); return e && e.classList.contains("show") && /\d+%/.test(e.textContent); }, null, {timeout: 5000}).catch(() => {});
    const pill = await R.p.evaluate(() => { const e = document.getElementById("devDlPill"); return e ? e.textContent : ""; });
    ok(/Chrome is downloading its free AI \(one time only\): \d+%/.test(pill), "Chrome's one-time download says so, with its progress: " + pill);
    await R.p.waitForFunction(() => !document.querySelector("#devDlPill.show"), null, {timeout: 10000}).catch(() => {});
    ok(await R.p.evaluate(() => !document.querySelector("#devDlPill.show")), "and the message goes when it's done");
    await R.ctx.close(); }
  await b.close(); server.close();
  console.log(`\nai-device-speed.e2e: ${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
