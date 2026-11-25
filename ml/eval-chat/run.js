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
// (thinking off, effort low); a schema is given in the prompt (CLAUDE_FORMAT=1 enforces it with structured outputs, slow to compile).
const CLAUDE = process.env.CLAUDE || "";
// ENGINE=cloud: no on-device model at all. The app runs as it does for a student with Claude (Haiku 5.5, "Studyboard AI Mode"):
// its own cloud instructions and steps, calling the Claude API itself with ANTHROPIC_API_KEY. The runner only watches those calls
// (tokens, rate limits). This is Studyboard AI's real path, without the extra help the small on-device models get.
const CLOUD = process.env.ENGINE === "cloud";
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
    // a key that isn't tied to one workspace needs the workspace named: ANTHROPIC_WORKSPACE_ID
    const ws = process.env.ANTHROPIC_WORKSPACE_ID;
    claudeClient = new (Anthropic.default || Anthropic)(Object.assign({maxRetries: 0}, key ? {apiKey: key, authToken: null} : {}, ws ? {defaultHeaders: {"anthropic-workspace-id": ws}} : {})); }
  const base = {model: CLAUDE, max_tokens: Math.max(j.max || 700, 1200), system: j.system || undefined, thinking: {type: "disabled"}};
  const ask = fmt => claudeClient.messages.create(Object.assign({}, base, {messages: [{role: "user", content: j.text + (j.schema && !fmt ? "\n\nRespond with JSON that matches this JSON Schema: " + JSON.stringify(j.schema) : "")}],
    output_config: Object.assign({effort: "low"}, fmt ? {format: {type: "json_schema", schema: claudeSchema(j.schema)}} : {})}));
  // retries done here (not silently in the SDK), so a rate limit shows: "rate limited (429), waiting 20s"
  const askR = async fmt => { const A0 = require("@anthropic-ai/sdk"), A = A0.default || A0;
    for (let i = 0; ; i++) { try { return await ask(fmt); } catch (e) {
      const again = e instanceof A.RateLimitError || e instanceof A.InternalServerError || e instanceof A.APIConnectionError || e.status === 529;
      if (!again || i >= 8) throw e;
      const ra = Number(e.headers && (e.headers.get ? e.headers.get("retry-after") : e.headers["retry-after"])) || 0, wait = Math.min(90, Math.max(ra, 2 * 2 ** i));
      CLAUDE_USE.waits++; CLAUDE_USE.waited += wait;
      console.log(`  Claude ${e.status || "connection"}${e.status === 429 ? " rate limited" : e.status === 529 ? " overloaded" : ""}, waiting ${wait}s (try ${i + 2})${e.status === 429 ? ": " + String(e.message).slice(0, 140) : ""}`);
      await new Promise(r => setTimeout(r, wait * 1000)); } } };
  let m, t0 = Date.now(); LIVE.claude++;
  // (the schema goes in the prompt, as words: enforcing it with structured outputs meant compiling the app's 30-field intent
  // schema first, which took minutes at the first question that needed it. CLAUDE_FORMAT=1 enforces it anyway.)
  try { m = await askR(!!j.schema && process.env.CLAUDE_FORMAT === "1"); }
  catch (e) { const Anthropic = require("@anthropic-ai/sdk"), A = Anthropic.default || Anthropic;
    // a key problem fails every request: stop at once rather than record a whole run of "the AI isn't answering"
    if (e instanceof A.AuthenticationError || e instanceof A.PermissionDeniedError || (e instanceof A.BadRequestError && /workspace|credit balance/i.test(e.message))) { console.error(`\nClaude API sign-in failed (${e.status}): ${e.message}\nSet ANTHROPIC_API_KEY to a valid key and start again: it carries on from here (nothing from this conversation was saved, and what's in ${OUTF} is kept).`); process.exit(2); }
    if (!(j.schema && e instanceof A.BadRequestError)) throw e; if (process.env.LOGLLM) console.log("schema refused, asking without it:", e.message); m = await askR(false); }
  LIVE.claude--;
  if (Date.now() - t0 > 30000) console.log(`  Claude took ${Math.round((Date.now() - t0) / 1000)}s for one request (${m.usage.input_tokens} tokens in, ${m.usage.output_tokens} out)`);
  CLAUDE_USE.inp += m.usage.input_tokens; CLAUDE_USE.out += m.usage.output_tokens; CLAUDE_USE.n++;
  if (m.stop_reason === "refusal") return "";
  return m.content.filter(b => b.type === "text").map(b => b.text).join("");
}
const CLAUDE_USE = {inp: 0, out: 0, n: 0, waits: 0, waited: 0};
// EVAL_ANTHROPIC_KEY: the key under a name Claude Code doesn't read, so a Claude Code session running these tests stays on its own
// sign-in (with ANTHROPIC_API_KEY set, Claude Code itself switched to billing that key)
if (!process.env.ANTHROPIC_API_KEY && process.env.EVAL_ANTHROPIC_KEY) process.env.ANTHROPIC_API_KEY = process.env.EVAL_ANTHROPIC_KEY;
// what the run is waiting on right now, for the heartbeat
const LIVE = {claude: 0, web: new Map(), cv: "", turn: 0, q: "", t0: 0, page: null};
// a Claude API key from the Claude Console (sk-ant-api...), checked before anything runs: without one the SDK falls back to any
// other sign-in on the computer (a Claude subscription's token is sent as a bearer token and refused: "Invalid bearer token")
if (CLAUDE || CLOUD) { const k = process.env.ANTHROPIC_API_KEY || "";
  if (!k) { console.error("CLAUDE or ENGINE=cloud is set but no key: set EVAL_ANTHROPIC_KEY (or ANTHROPIC_API_KEY) (in the same window) to a Claude API key from console.anthropic.com, API Keys."); process.exit(2); }
  // (Console keys come as sk-ant-api... and, for personal keys, sk-ant-usr...; only a subscription's OAuth token is refused here)
  if (/^sk-ant-oat/.test(k.trim())) { console.error("ANTHROPIC_API_KEY is a Claude subscription or Claude Code token (sk-ant-oat...), which the API doesn't take as a key. Make an API key at console.anthropic.com, API Keys."); process.exit(2); }
  if (k !== k.trim()) process.env.ANTHROPIC_API_KEY = k.trim(); }
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".wasm": "application/wasm"};
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__llm" && CLAUDE) { let b = ""; req.on("data", c => b += c); req.on("end", async () => { try { const j = JSON.parse(b), t = await askClaude(j);
    res.writeHead(200, {"content-type": "text/plain"}); res.end(t); if (process.env.LOGLLM) console.log("\n--- PROMPT:", j.text.slice(-600), "\n--- REPLY:", t); } catch (e) { LIVE.claude = Math.max(0, LIVE.claude - 1); console.warn("claude", e.message); res.writeHead(500); res.end(String(e)); } }); return; }
  if (u.pathname === "/__llm") { let b = ""; req.on("data", c => b += c); req.on("end", async () => { try { const j = JSON.parse(b);
    const r = await fetch(LLM + "/v1/chat/completions", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({messages: [{role: "system", content: j.system}, {role: "user", content: j.text + (j.schema ? "\n\nRespond with JSON that matches this JSON Schema: " + JSON.stringify(j.schema) : "")}], temperature: 0.3, max_tokens: j.max || 700, chat_template_kwargs: {enable_thinking: false}, response_format: j.schema ? {type: "json_object", schema: j.schema} : undefined})});
    const k = await r.json(); if (process.env.LOGLLM && !(k.choices && k.choices[0].message.content)) fs.appendFileSync("empty.jsonl", JSON.stringify({req: j, res: k}) + "\n"); res.writeHead(200, {"content-type": "text/plain"}); res.end(k.choices ? k.choices[0].message.content : JSON.stringify(k)); if (process.env.LOGLLM) console.log("\n--- LLM SYSTEM:", j.system.slice(0, 300), "\n--- PROMPT:", j.text.slice(-900), "\n--- REPLY:", k.choices ? k.choices[0].message.content : ""); } catch (e) { res.writeHead(500); res.end(String(e)); } }); return; }
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
  // (the browser, set up again if it crashes: "Target page, context or browser has been closed" ended a run at p3-115)
  let b = null, ctx = null;
  const boot = async () => { try { if (b) await b.close(); } catch (e) {}
  b = await chromium.launch({executablePath}); ctx = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
  const e4b = process.env.ENGINE === "e4b";
  await ctx.addInitScript({content: (CLOUD ? "" : e4b ? `(${e4bStub})();` : `(${stub})(6144);`) + (CLOUD ? " window.__SB_OWN_KEYS = true;" : "") + ` window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__SB_WEB_TEST = true; window.__CHAT_MAX = 400000;`});
  await ctx.addInitScript({content: `localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"})); localStorage.setItem("studyboard:devAIOk", "1");
    localStorage.removeItem("studioso:pomo"); // (a focus timer from the last conversation would carry on into this one)
    localStorage.setItem("coursework:v2", JSON.stringify(${fs.readFileSync(path.join(__dirname, "planner.js"), "utf8")}));`});
  if (CLOUD) {
    // the student's own Claude key, chosen in Settings (Claude Haiku 5.5, Studyboard AI Mode)
    await ctx.addInitScript(k => { localStorage.setItem("studyboard:aiKeys", JSON.stringify({anthropic: k})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({anthropic: {v: 1, at: Date.now()}}));
      // each conversation is a student with their full allowance: the own-key meter ($0.52 a week, thinking less past $0.40) would
      // otherwise add up across all 1,100 conversations and stop the run a fifth of the way through ("Your Claude Key's Limit Is Reached")
      localStorage.removeItem("studyboard:ownAI");
      const c = JSON.parse(localStorage.getItem("coursework:v2")); c.settings = Object.assign({}, c.settings, {ai: {provider: "anthropic", model: "studyboard", ownKey: true}}); localStorage.setItem("coursework:v2", JSON.stringify(c)); }, (process.env.ANTHROPIC_API_KEY || "").trim());
    // the app's own Claude calls, passed straight through and counted (tokens, rate limits, time)
    await ctx.route(/api\.anthropic\.com/, async route => { const t0 = Date.now(); LIVE.claude++;
      try { const r = await route.fetch({timeout: 300000}), body = await r.text(), st = r.status(); let j = null; try { j = JSON.parse(body); } catch (e) {}
        // CLOUDLOG=1: each request the app sends Claude (its instructions' first and last lines, the message) and Claude's reply, to see
        // why the app's Claude path did what it did. CLOUDLOG=full writes them whole to cloud-log.jsonl.
        if (process.env.CLOUDLOG) { let rq = null; try { rq = JSON.parse(route.request().postData() || "null"); } catch (e) {}
          const sys = rq ? (typeof rq.system === "string" ? rq.system : (rq.system || []).map(x => x.text || "").join("\n")) : "", msg = rq ? JSON.stringify((rq.messages || []).slice(-1)[0] || {}).slice(0, 4000) : "", rep = j && j.content ? j.content.filter(b => b.type === "text").map(b => b.text).join("") : body.slice(0, 500);
          if (process.env.CLOUDLOG === "full") fs.appendFileSync(path.join(__dirname, "cloud-log.jsonl"), JSON.stringify({cv: LIVE.cv, q: LIVE.q, system: sys, request: rq && Object.assign({}, rq, {system: undefined}), reply: rep, status: st}) + "\n");
          else console.log(`\n--- ${LIVE.cv} "${LIVE.q}" → Claude (${st})\n  instructions: ${sys.slice(0, 160).replace(/\n/g, " ")} … ${sys.slice(-200).replace(/\n/g, " ")}\n  message: ${msg.slice(-600)}\n  reply: ${rep.slice(0, 600)}`); }
        if (j && j.usage) { CLAUDE_USE.n++; CLAUDE_USE.inp += (j.usage.input_tokens || 0) + (j.usage.cache_read_input_tokens || 0) + (j.usage.cache_creation_input_tokens || 0); CLAUDE_USE.out += j.usage.output_tokens || 0; }
        if (st === 401 || st === 403) { console.error(`\nClaude API sign-in failed (${st}): ${body.slice(0, 200)}\nSet ANTHROPIC_API_KEY to a valid key and start again (the results so far are kept).`); process.exit(2); }
        if (st === 429 || st === 529) { CLAUDE_USE.waits++; console.log(`  Claude ${st}${st === 429 ? " rate limited" : " overloaded"} (the app retries): ${body.slice(0, 140)}`); }
        if (Date.now() - t0 > 30000) console.log(`  Claude took ${Math.round((Date.now() - t0) / 1000)}s for one request${j && j.usage ? ` (${j.usage.input_tokens} tokens in, ${j.usage.output_tokens} out)` : ""}`);
        await route.fulfill({response: r, body}); }
      catch (e) { console.log(`  Claude request failed after ${Math.round((Date.now() - t0) / 1000)}s: ${String(e && e.message || e).slice(0, 200)}`); route.abort().catch(() => {}); } finally { LIVE.claude--; } });
  }
  // Wikipedia through the disk cache (shared with the other runs), one at a time
  const WC = path.join(__dirname, "webcache"); fs.mkdirSync(WC, {recursive: true}); let wq = Promise.resolve();
  await ctx.route(/(wikipedia\.org|wiktionary\.org|openalex\.org)/, async route => {
    const turn = wq; let free; wq = new Promise(r => { free = r; }); await turn; setTimeout(free, 350);
    const url = route.request().url(), key = path.join(WC, require("crypto").createHash("sha1").update(url).digest("hex") + ".json");
    if (fs.existsSync(key)) { const c = JSON.parse(fs.readFileSync(key, "utf8")); return route.fulfill({status: c.status, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: c.body}); }
    LIVE.web.set(url, Date.now());
    try { for (let i = 0; i < 5; i++) { try { const r = await fetch(url, {headers: {"user-agent": "StudyboardEval/1.0 (test harness)"}, signal: AbortSignal.timeout(20000)}); if (r.status === 429) { await new Promise(res => setTimeout(res, 1500 * (i + 1))); continue; } const body = await r.text(); if (r.ok) fs.writeFileSync(key, JSON.stringify({status: r.status, body})); return route.fulfill({status: r.status, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body}); } catch (e) { await new Promise(res => setTimeout(res, 1000)); } }
    return route.fulfill({status: 429, body: ""}); } finally { LIVE.web.delete(url); }
  });
  };
  await boot();
  const snap = p => p.evaluate(() => { const s = window.__sbSync.state, m = x => Array.isArray(x) ? Object.fromEntries(x.map(i => [i.id, i])) : (x || {});
    return JSON.parse(JSON.stringify({tasks: m(s.tasks), events: m(s.events), courses: m(s.courses), decks: m(s.decks), notes: s.notes, settings: s.settings})); });
  let n = 0;
  // IDS=file.txt (or "p1-001,p2-015"): only those conversations, e.g. the ones that failed, to check a fix
  const IDS = process.env.IDS ? new Set((fs.existsSync(process.env.IDS) ? fs.readFileSync(process.env.IDS, "utf8") : process.env.IDS).split(/[\s,]+/).filter(Boolean)) : null;
  const LIST = ALL.slice(FROM, TO).filter(c => !IDS || IDS.has(c.id)); let crashes = 0;
  if (IDS) console.log(`${LIST.length} of ${IDS.size} listed conversations found`);
  // every 30s while a turn runs long: what it's waiting on (Claude, a web page, or the app itself, with the app's own status line)
  setInterval(async () => { if (!LIVE.t0 || Date.now() - LIVE.t0 < 30000) return;
    let st = ""; try { st = await Promise.race([LIVE.page.evaluate(() => { const e = document.querySelector("#cptStatus, .cpt-wait"); return e ? e.innerText.trim().slice(0, 80) : ""; }), new Promise(r => setTimeout(() => r("(page not answering)"), 3000))]); } catch (e) { st = "(page closed)"; }
    const web = [...LIVE.web].map(([u, t]) => `${new URL(u).host} ${Math.round((Date.now() - t) / 1000)}s`).join(", ");
    console.log(`  … ${LIVE.cv} "${LIVE.q.slice(0, 40)}" ${Math.round((Date.now() - LIVE.t0) / 1000)}s: ${LIVE.claude} Claude request${LIVE.claude === 1 ? "" : "s"} open${web ? ", web: " + web : ""}${st ? ", app says: " + st : ""}`); }, 30000).unref();
  for (let ci = 0; ci < LIST.length; ci++) { const cv = LIST[ci];
    if (doneIds.has(cv.id)) continue;
    if (Date.now() > DEADLINE) { console.log("deadline: stopping"); break; }
    let p; try { p = await ctx.newPage(); } catch (e) { if (++crashes > 20) throw e; console.log("browser closed: starting it again"); await boot(); p = await ctx.newPage(); }
    const errs = []; p.on("pageerror", e => errs.push(e.message)); if (process.env.CONSOLE) p.on("console", m => { if (/warn|error/.test(m.type())) console.log("  [page " + m.type() + "]", m.text().slice(0, 400)); }); p.on("dialog", d => d.dismiss().catch(() => {}));
    const rec = {id: cv.id, cat: cv.cat, turns: []}; LIVE.cv = cv.id; LIVE.page = p;
    try {
      await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);
      await p.waitForFunction(cloud => window.SBCOMPTAB && window.__sbDevAI && window.__sbSync && (cloud || window.__sbDevAI.state.status === "available"), CLOUD, {timeout: 30000});
      await p.waitForTimeout(400);
      for (const t of cv.turns) {
        const t0 = Date.now(); let ans = "", dlg = "", left = false, why = ""; LIVE.turn++; LIVE.q = t.q; LIVE.t0 = t0;
        const B = await snap(p);
        try {
          await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); if (!document.querySelector("#cptIn")) SBCOMPTAB.open(); });
          await p.waitForSelector("#cptIn", {timeout: 10000});
          const n0 = await p.evaluate(() => document.querySelectorAll(".cpt-a, .cpt-err").length);
          const tb = await p.evaluate(() => Date.now()); await p.fill("#cptIn", t.q); await p.click("#cptGo");
          await p.waitForFunction(([n0, qn, tb]) => { const go = document.querySelector("#cptGo");
            // the reply saved in the chat for this message: done, wherever the app is showing (a reply that opened Settings closed the
            // chat while it was still working, and an empty answer was recorded)
            try { const cs = JSON.parse(localStorage.getItem("studyboard:comp:chats") || "[]").sort((a, b) => (b.at || 0) - (a.at || 0)), m = cs[0] && cs[0].msgs[cs[0].msgs.length - 1]; if (m && m.q === qn && (m.at || 0) >= tb && (m.a || m.err)) return true; } catch (e) {}
            if (!document.querySelector("#cptIn")) return false;
            if (document.querySelector("dialog[open]") && !(go && go.disabled)) return true; // (a sheet the chat opens while still working, like Settings for a setting it changes, isn't the reply) // (and the last reply is a reply, not the status line still showing: "Working out what to do…" was saved as an answer)
            const l = [...document.querySelectorAll(".cpt-a, .cpt-err")].pop();
            return document.querySelectorAll(".cpt-a, .cpt-err").length > n0 && !document.querySelector(".cpt-wait") && !document.querySelector("#cptStatus") && !(l && /^(Working out what to do|Thinking|Still thinking|Looking through|Doing those one at a time|Making your map|Adding to your map)/.test(l.innerText.trim())); }, [n0, String(t.q).replace(/\s+/g, " ").trim().slice(0, 1000), tb], {timeout: 420000});
          await p.waitForTimeout(800);
          left = await p.evaluate(() => !document.querySelector("#cptIn"));
          ans = await p.evaluate(() => { const l = [...document.querySelectorAll(".cpt-a, .cpt-err")].pop(); return l ? l.innerText.replace(/\s*(Save This Reply|Report Response)\s*/g, " ").trim() : ""; });
          // the chat left for another page (a study session, Flashcards, a deck): the reply it gave is read from the saved chat, and where it went is said
          if (left || !ans) { const sv = await p.evaluate(() => { try { const cs = JSON.parse(localStorage.getItem("studyboard:comp:chats") || "[]").sort((a, b) => (b.at || 0) - (a.at || 0)), m = cs[0] && cs[0].msgs[cs[0].msgs.length - 1];
              return m ? (m.a ? m.a.answer : m.err || "") + (document.querySelector('[data-act="fc-flip"]') ? " [the app opened a flashcard study session]" : "") : ""; } catch (e) { return ""; } }).catch(() => "");
            if (sv && !ans) ans = sv + (left ? " [the app left the chat to show it]" : ""); }
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
        LIVE.t0 = 0;
        rec.turns.push({q: t.q, expect: t.expect, ans: ans.slice(0, 6000), dlg, left, stateOk, state: t.state || "", diff: diff.slice(0, 6), secs: Math.round((Date.now() - t0) / 100) / 10, why});
      }
    } catch (e) { rec.err = String(e.message).slice(0, 150); }
    // the browser died under this conversation: not recorded, the browser starts again and the conversation is run again
    if (/has been closed|crashed|Target closed/i.test((rec.err || "") + rec.turns.map(t => t.why).join(" ")) && crashes < 20) { crashes++; console.log(`${cv.id}: the browser closed mid-conversation, starting it again and running it again`); await boot(); ci--; continue; }
    rec.errs = errs.slice(0, 2);
    fs.appendFileSync(OUTF, JSON.stringify(rec) + "\n"); n++;
    console.log(`${cv.id} [${cv.cat}] ${rec.turns.map(t => (t.stateOk === false ? "✗" : "·") + t.secs + "s").join(" ")} ${rec.turns.length ? rec.turns[0].q.slice(0, 50) + " -> " + rec.turns[rec.turns.length - 1].ans.replace(/\n/g, " ").slice(0, 80) : rec.err}`);
    await p.close().catch(() => {});
  }
  console.log(`done ${n}`); if (CLAUDE || CLOUD) console.log(`${CLAUDE || "claude-haiku-5-5 (the app's cloud path)"}: ${CLAUDE_USE.n} requests, ${CLAUDE_USE.inp} input and ${CLAUDE_USE.out} output tokens, ${CLAUDE_USE.waits} waits for rate limits or busy servers (${CLAUDE_USE.waited}s)`); await b.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
