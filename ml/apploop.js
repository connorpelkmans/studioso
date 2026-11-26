// The app in the loop: runs Studyboard's REAL on-device AI paths (the same prompts, fitting, sections and checks the downloaded
// Gemma gets) in a headless browser, with the model answered by any OpenAI-compatible server. Used for three things:
//
//   generate  the TEACHER answers each request best-of-n; every candidate is scored with the app's own checks; the best goes
//             back to the app (so later steps see good input) and all of them are logged: chosen ones become training data,
//             chosen-vs-worse pairs become preference data.
//   eval      a candidate STUDENT (or the stock model) answers with n=1; the final feature output is logged for scoring.
//   reference the same inputs through the app's normal cloud path with Gemini (the bar to match), for evaluation only.
//
//   node ml/apploop.js generate --driver studyset --docs ml/data/splits/train.jsonl --out ml/data/gen/studyset.jsonl --model TEACHER --n 4
//   node ml/apploop.js generate --driver replay   --inputs ml/data/inputs/train.jsonl --out ml/data/gen/replay.jsonl --model TEACHER --n 4
//   node ml/apploop.js eval     --driver studyset --docs ml/data/splits/test.jsonl --out ml/eval/out/student-v1.studyset.jsonl --model STUDENT
//   node ml/apploop.js reference --driver studyset --docs ml/data/splits/test.jsonl --out ml/eval/out/gemini.studyset.jsonl   (GEMINI_KEY)
// Options: --limit N, --workers W (browser pages at once), --mode cards|quiz|both (studyset), --web big|small (the prompt sizes
// of Gemma 4 E2B or the small Gemma 3 1B path; the custom model replaces one of them)
// Model settings come from the environment (MODEL prefix, e.g. TEACHER_URL, TEACHER_MODEL, TEACHER_KEY): see lib/llm.js.
const path = require("path"), fs = require("fs"), http = require("http"), crypto = require("crypto");
const REPO = path.join(__dirname, "..");
const {chromium, executablePath} = require(path.join(REPO, "tests", "pw"));
const {client, readJsonl} = require("./lib/llm"), {check} = require("./lib/schema"), {stepOf} = require("./lib/steps");

const args = process.argv.slice(2), cmd = args[0];
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
if (!["generate", "eval", "reference"].includes(cmd)) { console.error("usage: node ml/apploop.js generate|eval|reference --driver studyset|replay ... (see the top of this file)"); process.exit(2); }
const driver = opt("driver", "studyset"), out = opt("out"), limit = Number(opt("limit", 1e9)), workers = Number(opt("workers", 2)), n = cmd === "generate" ? Number(opt("n", 4)) : 1;
const mode = opt("mode", "both"), ctxWindow = Number(opt("ctx", 4096)), modelPrefix = opt("model", cmd === "generate" ? "TEACHER" : "STUDENT");
if (!out) { console.error("--out is required"); process.exit(2); }
fs.mkdirSync(path.dirname(out), {recursive: true});
const model = cmd === "reference" ? null : client(modelPrefix);
const items = (driver === "studyset" ? readJsonl(opt("docs")).map(d => ({id: "ss:" + d.id + ":" + mode, kind: "studyset", doc: d}))
  : readJsonl(opt("inputs")).map(x => ({id: "rp:" + x.id, kind: "replay", input: x})));
const done = new Set(readJsonl(out).filter(r => r.kind === "result").map(r => r.item));
const todo = items.filter(x => !done.has(x.id)).slice(0, limit);
console.error(`${cmd}: ${todo.length} to do (${done.size} already in ${out})`);
const write = rec => fs.appendFileSync(out, JSON.stringify(rec) + "\n");

const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".wasm": "application/wasm", ".gz": "application/gzip"};
const pages = new Map();   // page id -> {page, item}
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__llm") { let b = ""; req.on("data", c => b += c); req.on("end", async () => {
    try { const j = JSON.parse(b), text = await broker(j); res.writeHead(200, {"content-type": "application/json"}); res.end(JSON.stringify({content: text})); }
    catch (e) { res.writeHead(500); res.end(String(e && e.message || e)); } }); return; }
  let f; try { f = path.join(REPO, decodeURIComponent(u.pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(REPO + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});

// One request from the app's WebLLM path: messages exactly as the downloaded model gets them
async function broker({pid, req}){
  const P = pages.get(pid), item = P && P.item, sys = req.messages[0].content, user = req.messages.slice(1).map(m => m.content).join("\n\n");
  const schema = req.response_format && req.response_format.schema ? JSON.parse(req.response_format.schema) : null;
  const step = stepOf(sys, item && item.kind === "replay" ? item.input.job : null);
  const t0 = Date.now();
  let cands = await model.chat({messages: req.messages, temperature: n > 1 ? 0.8 : (req.temperature == null ? 0.3 : req.temperature), max_tokens: req.max_tokens || 1200, schema, n});
  // score every candidate: valid JSON, the schema, then the app's own checks (in the page, so they're the real ones)
  for (const c of cands) {
    let data = null; try { data = JSON.parse(String(c.content).replace(/^```(?:json)?\s*|```\s*$/g, "")); } catch (e) {}
    const errs = data == null ? ["not JSON"] : schema ? check(data, schema) : [];
    const g = data == null ? {score: -100, why: ["not JSON"]} : await P.page.evaluate(([st, u, d]) => window.__mlScore(st, u, d), [step, user, data]).catch(e => ({score: 0, why: ["score failed: " + e.message]}));
    c.score = g.score - errs.length * 5 - (c.finish === "length" ? 50 : 0); c.why = errs.slice(0, 5).concat(g.why || []);
  }
  const best = cands.slice().sort((a, b) => b.score - a.score || a.content.length - b.content.length)[0];
  if (cmd === "generate") write({kind: "call", item: item && item.id, job: step, doc: item && (item.doc ? item.doc.id : item.input.doc), messages: req.messages, max_tokens: req.max_tokens, schema,
    candidates: cands.map(c => ({content: c.content, score: c.score, why: c.why, finish: c.finish})), chosen: cands.indexOf(best), ms: Date.now() - t0});
  else write({kind: "call", item: item && item.id, job: step, messages: req.messages, output: best.content, score: best.score, why: best.why, ms: Date.now() - t0});
  return best.content;
}

// What runs in the page: the WebLLM engine stands in for the real one, the model call goes to the broker, and __mlScore uses
// the app's own gates (window.__sbAIGates, exposed only in test mode)
function pageSetup([pid, cw, engine, web]){
  window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__mlPid = pid;
  localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
  localStorage.setItem("sb-first-deck", "1");   // never the free cloud deck: this is about the device's model
  if (engine !== "device") return;
  // the downloaded model counts as already on the computer (WebLLM's path, without the consent question); which one: --web big|small
  localStorage.setItem("studyboard:webAIReady", web === "small" ? "gemma3-1b-it-q4f16_1-MLC" : "gemma-4-E2B-it-q4f16_1-MLC");
  if (web === "small") localStorage.setItem("studyboard:webAISmall", "1");
  window.__SB_GPU_STUB = {requestAdapter: async () => ({features: new Set(["shader-f16"]), limits: {maxBufferSize: 4e9, maxStorageBufferBindingSize: 2e9}})};
  Object.defineProperty(navigator, "deviceMemory", {value: 8, configurable: true});
  window.__SB_WEBLLM_STUB = {stubWorker: true, cached: true, CreateWebWorkerMLCEngine: async (w, id, cfg) => {
    cfg.initProgressCallback({progress: 1, text: "ready"});
    return {chat: {completions: {create: async req => {
      const r = await fetch("/__llm", {method: "POST", body: JSON.stringify({pid: window.__mlPid, req})});
      if (!r.ok) throw new Error("model " + r.status + ": " + (await r.text()).slice(0, 200));
      const j = await r.json(); return {choices: [{message: {content: j.content}, finish_reason: "stop"}]};
    }}}, unload: async () => {}, interruptGenerate(){}};
  }};
  window.__mlScore = (step, user, data) => {
    const G = window.__sbAIGates; if (!G) return {score: 0, why: ["no gates"]};
    const notes = user, copy = G.copyIndex([notes]), corpus = G.corpus([notes]), why = []; let s = 10;
    const strs = []; (function walk(x){ if (typeof x === "string") strs.push(x); else if (x && typeof x === "object") Object.values(x).forEach(walk); })(data);
    const empty = strs.filter(t => !t.trim()).length; if (empty) { s -= empty * 2; why.push(empty + " empty fields"); }
    if (Array.isArray(data.cards)) {
      const g = G.cards(data.cards, {copy, corpus}), d = g.dropped, lost = d.dup + d.long + d.empty + d.copied + d.vague;
      const flagged = g.cards.filter(c => c.check).length;
      s += (g.cards.length - flagged) * 2 - flagged - lost * 3; if (lost) why.push(`gate dropped ${JSON.stringify(d)}`); if (flagged) why.push(flagged + " cards not grounded");
      const basisBad = data.cards.filter(c => c && c.basis && !G.basis(c.basis, notes)).length; if (basisBad) { s -= basisBad * 3; why.push(basisBad + " bases not in notes"); }
    }
    if (Array.isArray(data.questions)) {
      try { const g = G.questions(data.questions, {copy, corpus}), d = g.dropped, lost = d.dup + d.bad + d.copied; s += g.questions.length * 2 - lost * 3; if (lost) why.push(`gate dropped ${JSON.stringify(d)}`); }
      catch (e) { s -= 20; why.push("questions malformed"); }
    }
    if (Array.isArray(data.facts)) { const ok = data.facts.filter(f => typeof f === "string" && G.basis(f, notes)).length, bad = data.facts.length - ok; s += ok - bad * 3; if (bad) why.push(bad + " facts not in notes"); }
    return {score: s, why};
  };
}

async function runItem(b, port, item, pid, engine){
  const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
  try {
    await ctx.addInitScript(pageSetup, [pid, ctxWindow, engine, opt("web", "big")]);
    if (engine === "gemini") await ctx.addInitScript(([k]) => { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: k})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }, [process.env.GEMINI_KEY || ""]);
    const course = item.doc ? (item.doc.subject || "General") : "General";
    await ctx.addInitScript(([c]) => { if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: c, code: "X 101", color: "#3B6FE0"}]})); }, [course]);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    pages.set(pid, {page, item});
    await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForFunction(() => window.__sbSync && window.__sbDevAI, null, {timeout: 60000});
    const t0 = Date.now(); let result;
    if (item.kind === "studyset") result = await studyset(page, item.doc.text);
    else result = await page.evaluate(async x => { try { const r = await window.__sbDevAI.call({system: x.system, parts: x.parts, schema: x.schema, maxTokens: x.maxTokens, task: x.task || ""}); return {data: r.data, truncated: !!r.truncated}; }
      catch (e) { return {error: (e && (e.code + ": " + e.message)) || String(e)}; } }, item.input);
    write(Object.assign({kind: "result", item: item.id, engine, job: item.kind === "replay" ? item.input.job : "studyset:" + mode, doc: item.doc ? item.doc.id : item.input.doc, ms: Date.now() - t0, pageErrors: errs.slice(0, 3)}, result));
  } finally { pages.delete(pid); await ctx.close().catch(() => {}); }
}
async function studyset(p, text){
  await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); });
  await p.waitForSelector("#dlg[open] #aiGo", {timeout: 30000});
  await p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, text);
  await p.evaluate(m => { const c = document.querySelector("#aiCards"), q = document.querySelector("#aiQuiz"); if (c && c.checked !== (m !== "quiz")) c.click(); if (q && q.checked !== (m !== "cards")) q.click(); }, mode);
  await p.click("#aiGo");
  await p.waitForFunction(() => document.querySelector("dialog[open] #arSave") || (document.querySelector("#aiGo") && !document.querySelector("#aiGo").disabled && !/…|\.\.\./.test((document.querySelector("#aiStatus") || {}).textContent || "")), null, {timeout: 60 * 60000, polling: 1000}).catch(() => {});
  return p.evaluate(() => {
    if (!document.querySelector("dialog[open] #arSave")) return {error: (document.querySelector("#aiStatus") || {}).textContent || "no result"};
    return {cards: [...document.querySelectorAll("#arCards li")].map(li => ({front: (li.querySelector('[data-f="front"]') || {}).value || "", back: (li.querySelector('[data-f="back"]') || {}).value || "", flagged: !!li.querySelector(".ar-chk")})),
      questions: [...document.querySelectorAll("#arQs > li, .ar-qs > li")].map(li => li.innerText.replace(/\n+/g, " | ").slice(0, 1500)),
      notes: ((document.querySelector("dialog[open]") || {}).innerText.match(/(Left out|Corrected)[^.]*\./g) || [])};
  });
}

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath}), engine = cmd === "reference" ? "gemini" : "device";
  if (engine === "gemini" && !process.env.GEMINI_KEY) { console.error("reference needs GEMINI_KEY (your own Gemini API key; used only for evaluation, never for training data)"); process.exit(2); }
  let next = 0, fin = 0; const t0 = Date.now();
  await Promise.all(Array.from({length: Math.min(workers, todo.length)}, async (_, w) => {
    while (next < todo.length) {
      const item = todo[next++], pid = crypto.randomBytes(4).toString("hex");
      try { await runItem(b, port, item, pid, engine); } catch (e) { write({kind: "result", item: item.id, engine, error: "harness: " + e.message}); }
      fin++; const st = model ? model.stats : {}; console.error(`[${fin}/${todo.length}] ${item.id} ${Math.round((Date.now() - t0) / 1000)}s ${model ? `calls ${st.calls} fails ${st.fails} tokens ${st.inTok}+${st.outTok} $${st.usd.toFixed(3)}` : ""}`);
    }
  }));
  await b.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
