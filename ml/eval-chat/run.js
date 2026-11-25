// Runs conversations.json through Studyboard's real chat with an on-device model answering through a llama.cpp server.
// ENGINE=chrome (Gemma 3n E2B standing in for Chrome's built-in AI, LLM=http://127.0.0.1:8088) or ENGINE=e4b (Gemma 4 E4B, :8089).
// QFILE=conversations.json OUT=results.jsonl [FROM= TO= MINS=] node run.js   (resumes: ids already in OUT are skipped)
// E4B: the same bank harness, with the app running as it does on a computer with Gemma 4 E4B (DEVAI litert, devLite: 8K, the E4B
// instructions), each request answered by Google's Gemma 4 E4B (QAT 4-bit GGUF) on llama.cpp at :8089. Each answer is checked automatically: time, not filler, the expected facts, no "couldn't find" where it should know.
const path = require("path"), fs = require("fs"), http = require("http");
const REPO = process.env.REPO || require("path").join(__dirname, "..", ".."), OUT = path.join(__dirname, process.argv[2] || "acts.out.json"), ONLY = process.argv[3] || "";
const {chromium, executablePath} = require(path.join(REPO, "tests", "pw"));
const LLM = process.env.LLM || (process.env.ENGINE === "e4b" ? "http://127.0.0.1:8089" : "http://127.0.0.1:8088");
// CLAUDE=claude-haiku-5-5: the same harness, app path and prompts (ENGINE still picks E4B's or the smaller models' instructions),
// with every request the app makes answered by that Claude model instead of a llama.cpp server. Needs ANTHROPIC_API_KEY (or an
// \`ant auth login\` profile) and the SDK (npm install --no-save @anthropic-ai/sdk). Like the on-device models it doesn't think
// (thinking off, effort low), and a schema is enforced with structured outputs, as llama.cpp enforces it with a grammar.
const CLAUDE = process.env.CLAUDE || "";
let claudeClient = null;
// The app's schemas, made acceptable to structured outputs: every object closed, constraints it doesn't take left out
const claudeSchema = s => { if (Array.isArray(s)) return s.map(claudeSchema); if (!s || typeof s !== "object") return s;
  const o = {}; for (const [k, v] of Object.entries(s)) { if (/^(minimum|maximum|minLength|maxLength|minItems|maxItems|pattern|format|multipleOf|exclusiveMinimum|exclusiveMaximum|nullable|propertyOrdering)$/.test(k)) continue; o[k] = claudeSchema(v); }
  if (typeof o.type === "string") o.type = o.type.toLowerCase();
  if (o.type === "object" || o.properties) { o.type = "object"; o.properties = o.properties || {}; o.additionalProperties = false; }
  return o; };
async function askClaude(j){
  // (an API key in ANTHROPIC_API_KEY is used as it is: without authToken: null, an ANTHROPIC_AUTH_TOKEN or saved sign-in on the
  // computer was sent as well, and every request came back 401 "Invalid bearer token")
  if (!claudeClient) { const Anthropic = require("@anthropic-ai/sdk"), key = process.env.ANTHROPIC_API_KEY;
    claudeClient = new (Anthropic.default || Anthropic)(Object.assign({maxRetries: 6}, key ? {apiKey: key, authToken: null} : {})); }
  const base = {model: CLAUDE, max_tokens: Math.max(j.max || 700, 1200), system: j.system || undefined, thinking: {type: "disabled"}};
  const ask = fmt => claudeClient.messages.create(Object.assign({}, base, {messages: [{role: "user", content: j.text + (j.schema && !fmt ? "\n\nRespond with JSON that matches this JSON Schema: " + JSON.stringify(j.schema) : "")}],
    output_config: Object.assign({effort: "low"}, fmt ? {format: {type: "json_schema", schema: claudeSchema(j.schema)}} : {})}));
  let m;
  try { m = await ask(!!j.schema); }
  catch (e) { const Anthropic = require("@anthropic-ai/sdk"), A = Anthropic.default || Anthropic;
    // a key problem fails every request: stop at once rather than record a whole run of "the AI isn't answering"
    if (e instanceof A.AuthenticationError || e instanceof A.PermissionDeniedError) { console.error(`\nClaude API sign-in failed (${e.status}): ${e.message}\nSet ANTHROPIC_API_KEY to a valid key, delete ${OUTF}, and start again.`); process.exit(2); }
    if (!(j.schema && e instanceof A.BadRequestError)) throw e; if (process.env.LOGLLM) console.log("schema refused, asking without it:", e.message); m = await ask(false); }
  CLAUDE_USE.inp += m.usage.input_tokens; CLAUDE_USE.out += m.usage.output_tokens; CLAUDE_USE.n++;
  if (m.stop_reason === "refusal") return "";
  return m.content.filter(b => b.type === "text").map(b => b.text).join("");
}
const CLAUDE_USE = {inp: 0, out: 0, n: 0};
// a Claude API key from the Claude Console (sk-ant-api...), checked before anything runs: without one the SDK falls back to any
// other sign-in on the computer (a Claude subscription's token is sent as a bearer token and refused: "Invalid bearer token")
if (CLAUDE) { const k = process.env.ANTHROPIC_API_KEY || "";
  if (!k) { console.error("CLAUDE is set but ANTHROPIC_API_KEY isn't. Set it (in the same window) to a Claude API key from console.anthropic.com, API Keys."); process.exit(2); }
  if (!/^sk-ant-api/.test(k.trim())) { console.error(`ANTHROPIC_API_KEY doesn't look like a Claude API key (those start sk-ant-api; this starts ${k.trim().slice(0, 10)}...). A Claude subscription or Claude Code token won't work: make an API key at console.anthropic.com, API Keys.`); process.exit(2); }
  if (k !== k.trim()) process.env.ANTHROPIC_API_KEY = k.trim(); }
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".wasm": "application/wasm"};
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__llm" && CLAUDE) { let b = ""; req.on("data", c => b += c); req.on("end", async () => { try { const j = JSON.parse(b), t = await askClaude(j);
    res.writeHead(200, {"content-type": "text/plain"}); res.end(t); if (process.env.LOGLLM) console.log("\n--- PROMPT:", j.text.slice(-600), "\n--- REPLY:", t); } catch (e) { console.warn("claude", e.message); res.writeHead(500); res.end(String(e)); } }); return; }
  if (u.pathname === "/__llm") { let b = ""; req.on("data", c => b += c); req.on("end", async () => { try { const j = JSON.parse(b);
    const r = await fetch(LLM + "/v1/chat/completions", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({messages: [{role: "system", content: j.system}, {role: "user", content: j.text + (j.schema ? "\n\nRespond with JSON that matches this JSON Schema: " + JSON.stringify(j.schema) : "")}], temperature: 0.3, max_tokens: j.max || 700, response_format: j.schema ? {type: "json_object", schema: j.schema} : undefined})});
    const k = await r.json(); res.writeHead(200, {"content-type": "text/plain"}); res.end(k.choices ? k.choices[0].message.content : JSON.stringify(k)); if (process.env.LOGLLM) console.log("\n--- LLM SYSTEM:", j.system.slice(0, 300), "\n--- PROMPT:", j.text.slice(-900), "\n--- REPLY:", k.choices ? k.choices[0].message.content : ""); } catch (e) { res.writeHead(500); res.end(String(e)); } }); return; }
  let f; try { f = path.join(REPO, decodeURIComponent(u.pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(REPO + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const stub = cw => { window.LanguageModel = {availability: async () => "available", create: async o => { const system = ((o.initialPrompts || [])[0] || {}).content || "";
  const s = {contextWindow: cw, contextUsage: Math.ceil(system.length / 3.6), destroy(){}, clone: async () => s, async prompt(input, po){
    const text = input.map(m => (Array.isArray(m.content) ? m.content : [{value: m.content}]).map(c => typeof c.value === "string" ? c.value : "[picture]").join("\n")).join("\n");
    window.__calls = (window.__calls || 0) + 1;
    const r = await fetch("/__llm", {method: "POST", body: JSON.stringify({system, text, schema: po && po.responseConstraint})}); if (!r.ok) throw new Error("llm"); return r.text(); },
    promptStreaming(input, po){ const p = s.prompt(input, po); return (async function*(){ yield await p; })(); }}; return s; }}; };
const e4bStub = () => {
  const worker = () => { const w = {onmessage: null, terminate(){}, postMessage(m){
    if (m.t === "load") { setTimeout(() => w.onmessage({data: {t: "loaded", id: m.id}}), 5); return; }
    if (m.t !== "ask") return;
    window.__calls = (window.__calls || 0) + 1;
    // (like the real engine, it reports progress while it writes)
    const tick = setInterval(() => w.onmessage({data: {t: "partial", id: m.id, n: 60}}), 4000);
    fetch("/__llm", {method: "POST", body: JSON.stringify({system: m.system, text: m.text, schema: m.schema, max: m.maxTokens, temperature: m.temperature})})
      .then(r => r.ok ? r.text() : Promise.reject(new Error("llm")))
      .then(t => { clearInterval(tick); w.onmessage({data: {t: "done", id: m.id, text: t}}); }, e => { clearInterval(tick); w.onmessage({data: {t: "error", id: m.id, message: String(e)}}); });
  }}; return w; };
  window.__SB_E4B_STUB = {fits: true, ready: true, worker, model: new Blob(["e4b"])};
  localStorage.setItem("studyboard:e4bReady", "1");
};

// Conversations: [{id, cat, turns: [{q, expect, state?}]}], run in order, each in a fresh app; one JSON line per conversation
const ALL = JSON.parse(fs.readFileSync(process.env.QFILE, "utf8")), FROM = +(process.env.FROM || 0), TO = +(process.env.TO || ALL.length), OUTF = process.env.OUT;
const doneIds = new Set(fs.existsSync(OUTF) ? fs.readFileSync(OUTF, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l).id) : []);
const DEADLINE = Date.now() + (+(process.env.MINS || 100)) * 60000;
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch({executablePath}), ctx = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
  const e4b = process.env.ENGINE === "e4b";
  await ctx.addInitScript({content: (e4b ? `(${e4bStub})();` : `(${stub})(6144);`) + ` window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__SB_WEB_TEST = true; window.__CHAT_MAX = 400000;`});
  await ctx.addInitScript({content: `localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"})); localStorage.setItem("studyboard:devAIOk", "1");
    localStorage.setItem("coursework:v2", JSON.stringify(${fs.readFileSync(path.join(__dirname, "planner.js"), "utf8")}));`});
  // Wikipedia through the disk cache (shared with the other runs), one at a time
  const WC = path.join(__dirname, "webcache"); fs.mkdirSync(WC, {recursive: true}); let wq = Promise.resolve();
  await ctx.route(/(wikipedia\.org|wiktionary\.org|openalex\.org)/, async route => {
    const turn = wq; let free; wq = new Promise(r => { free = r; }); await turn; setTimeout(free, 350);
    const url = route.request().url(), key = path.join(WC, require("crypto").createHash("sha1").update(url).digest("hex") + ".json");
    if (fs.existsSync(key)) { const c = JSON.parse(fs.readFileSync(key, "utf8")); return route.fulfill({status: c.status, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: c.body}); }
    for (let i = 0; i < 5; i++) { try { const r = await fetch(url, {headers: {"user-agent": "StudyboardEval/1.0 (test harness)"}}); if (r.status === 429) { await new Promise(res => setTimeout(res, 1500 * (i + 1))); continue; } const body = await r.text(); if (r.ok) fs.writeFileSync(key, JSON.stringify({status: r.status, body})); return route.fulfill({status: r.status, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body}); } catch (e) { await new Promise(res => setTimeout(res, 1000)); } }
    return route.fulfill({status: 429, body: ""});
  });
  const snap = p => p.evaluate(() => { const s = window.__sbSync.state, m = x => Array.isArray(x) ? Object.fromEntries(x.map(i => [i.id, i])) : (x || {});
    return JSON.parse(JSON.stringify({tasks: m(s.tasks), events: m(s.events), courses: m(s.courses), decks: m(s.decks), notes: s.notes, settings: s.settings})); });
  let n = 0;
  for (const cv of ALL.slice(FROM, TO)) {
    if (doneIds.has(cv.id)) continue;
    if (Date.now() > DEADLINE) { console.log("deadline: stopping"); break; }
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("dialog", d => d.dismiss().catch(() => {}));
    const rec = {id: cv.id, cat: cv.cat, turns: []};
    try {
      await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);
      await p.waitForFunction(() => window.SBCOMPTAB && window.__sbDevAI && window.__sbSync && window.__sbDevAI.state.status === "available", null, {timeout: 30000});
      await p.waitForTimeout(400);
      for (const t of cv.turns) {
        const t0 = Date.now(); let ans = "", dlg = "", left = false, why = "";
        const B = await snap(p);
        try {
          await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); if (!document.querySelector("#cptIn")) SBCOMPTAB.open(); });
          await p.waitForSelector("#cptIn", {timeout: 10000});
          const n0 = await p.evaluate(() => document.querySelectorAll(".cpt-a, .cpt-err").length);
          await p.fill("#cptIn", t.q); await p.click("#cptGo");
          await p.waitForFunction(n0 => { if (!document.querySelector("#cptIn") || document.querySelector("dialog[open]")) return true; return document.querySelectorAll(".cpt-a, .cpt-err").length > n0 && !document.querySelector(".cpt-wait"); }, n0, {timeout: 420000});
          await p.waitForTimeout(800);
          left = await p.evaluate(() => !document.querySelector("#cptIn"));
          ans = await p.evaluate(() => { const l = [...document.querySelectorAll(".cpt-a, .cpt-err")].pop(); return l ? l.innerText.replace(/\s*(Save This Reply|Report Response)\s*/g, " ").trim() : ""; });
          dlg = await p.evaluate(() => { const d = document.querySelector("dialog[open]"); return d ? (d.getAttribute("aria-label") || (d.querySelector("h2,h3") || {}).textContent || "dialog") : ""; });
        } catch (e) { why = "ERR " + String(e.message).slice(0, 100); }
        const A = await snap(p).catch(() => B);
        let stateOk = null;
        if (t.state) { const find = (S, k) => re => Object.values(S[k] || {}).find(x => re.test(x.title || x.name || ""));
          const T = find(A, "tasks"), TB = find(B, "tasks"), D = find(A, "decks"), E = find(A, "events"), C = find(A, "courses"), NT = JSON.stringify(A.notes || "");
          const same = JSON.stringify({t: A.tasks, e: A.events, c: A.courses, d: A.decks, n: A.notes}) === JSON.stringify({t: B.tasks, e: B.events, c: B.courses, d: B.decks, n: B.notes});
          try { stateOk = !!eval(t.state); } catch (e) { stateOk = false; why += " state-err: " + e.message; } }
        // what changed, in a few words (for the judge)
        const diff = []; ["tasks", "events", "courses", "decks"].forEach(k => { const a = A[k] || {}, bb = B[k] || {}; Object.keys(a).forEach(id => { if (!bb[id]) diff.push(`new ${k.slice(0, -1)} "${a[id].title || a[id].name}"`); else if (JSON.stringify(a[id]) !== JSON.stringify(bb[id])) diff.push(`changed ${k.slice(0, -1)} "${a[id].title || a[id].name}"`); }); Object.keys(bb).forEach(id => { if (!a[id]) diff.push(`removed ${k.slice(0, -1)} "${bb[id].title || bb[id].name}"`); }); });
        if (JSON.stringify(A.notes) !== JSON.stringify(B.notes)) diff.push("notes changed");
        rec.turns.push({q: t.q, expect: t.expect, ans: ans.slice(0, 1500), dlg, left, stateOk, state: t.state || "", diff: diff.slice(0, 6), secs: Math.round((Date.now() - t0) / 100) / 10, why});
      }
    } catch (e) { rec.err = String(e.message).slice(0, 150); }
    rec.errs = errs.slice(0, 2);
    fs.appendFileSync(OUTF, JSON.stringify(rec) + "\n"); n++;
    console.log(`${cv.id} [${cv.cat}] ${rec.turns.map(t => (t.stateOk === false ? "✗" : "·") + t.secs + "s").join(" ")} ${rec.turns.length ? rec.turns[0].q.slice(0, 50) + " -> " + rec.turns[rec.turns.length - 1].ans.replace(/\n/g, " ").slice(0, 80) : rec.err}`);
    await p.close();
  }
  console.log(`done ${n}`); if (CLAUDE) console.log(`${CLAUDE}: ${CLAUDE_USE.n} requests, ${CLAUDE_USE.inp} input and ${CLAUDE_USE.out} output tokens`); await b.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
