/* ===== module: 01-ai-policy.js: the app's core, Studyboard AI's rules ===== */
/* Studyboard AI's rules: one copy, used in two places.
   - cloudflare/ai-pro (the Worker that runs Studyboard AI for paid Pro students) imports this file.
   - The app uses it when a student runs their own Claude key in Studyboard AI mode (Settings, AI Features).
   So both pick the same model, the same thinking for each job, the same output caps, the same prices and the same limits.
   Plain script, no imports: it works in the app's bundle and as a module the Worker imports (both read globalThis.SBPOLICY). */
const SBPOLICY = (() => {
  const MODEL = "claude-haiku-5-5";
  // Dollars per token on Haiku 5.5's normal rate card (prompts up to 100K tokens); over that, every rate times 5
  const PRICE = {in: 0.10e-6, cacheWrite: 0.125e-6, cacheRead: 0.01e-6, out: 0.50e-6};
  const LONG_PROMPT = 100000, LONG_MULT = 5;
  // Requests are capped below the long rate card
  const MAX_INPUT_TOKENS = 90000;
  // Fixed cost of a request's framing and the structured-output instructions, in tokens (added to every text estimate)
  const FRAME_TOKENS = 3000;
  const MAX_SCHEMA_CHARS = 20000, MAX_BLOCKS = 40, MAX_SYSTEM_BYTES = 60000;
  // Web lookups (Anthropic's web search and web fetch tools): a search costs $0.01; fetched pages and results are read as input.
  // These keep every round of the tool loop, all rounds together, under the 100K tokens where the price goes up 5 times:
  // (input + frame + one search + one page) x 3 rounds = (8,000 + 3,000 + 10,000 + 12,000) x 3 = 99,000.
  const WEB = {searchUses: 1, fetchUses: 1, fetchTokens: 12000, searchTokens: 10000, maxInput: 8000, perSearch: 0.01};
  // When a file can't be counted by Anthropic: the most an image can take, and a PDF page (its text plus its picture)
  const IMAGE_TOKENS = 6000, PDF_PAGE_TOKENS = 5000;

  // Thinking per job. none = thinking off. out = the most tokens one answer may use (thinking included).
  // routine: past the soft limit these drop to low thinking; hard jobs keep their level until the hard limit.
  const TASKS = {
    // Hard jobs, where answer quality matters most
    grade: {effort: "high", out: 6000}, tutor: {effort: "high", out: 12000}, rubric: {effort: "high", out: 12000},
    syllabus: {effort: "high", out: 32000}, cards: {effort: "high", out: 24000}, quiz: {effort: "high", out: 32000},
    cases: {effort: "high", out: 24000}, breakdown: {effort: "high", out: 8000}, practice: {effort: "high", out: 24000},
    // Conversation and middle-weight jobs
    chat: {effort: "medium", out: 6000, routine: true}, ask: {effort: "medium", out: 6000, routine: true},
    examplan: {effort: "medium", out: 8000, routine: true}, topics: {effort: "medium", out: 6000, routine: true},
    explain: {effort: "medium", out: 4000, routine: true}, summary: {effort: "medium", out: 12000, routine: true},
    photo: {effort: "medium", out: 10000, routine: true}, linknotes: {effort: "medium", out: 10000, routine: true},
    transcript: {effort: "medium", out: 16000, routine: true}, groupplan: {effort: "medium", out: 6000, routine: true},
    // The companion's Ask: answers, finds things in the app and proposes changes the student confirms
    assist: {effort: "medium", out: 6000, routine: true},
    // The automatic plan: medium, to match what free Gemini users get today (it drops to low past the soft limit)
    plan: {effort: "medium", out: 6000, routine: true},
    // Routine: ranks and words what the app has already worked out
    tune: {effort: "low", out: 4000, routine: true},
    estimate: {effort: "low", out: 3000, routine: true}, capture: {effort: "low", out: 4000, routine: true},
    weekly: {effort: "low", out: 2000, routine: true}, coach: {effort: "low", out: 3000, routine: true},
    "cards-light": {effort: "low", out: 10000, routine: true}, "quiz-light": {effort: "low", out: 10000, routine: true},
    "cases-light": {effort: "low", out: 10000, routine: true}, rewrite: {effort: "low", out: 9000, routine: true},
    // Reading an equation the student selected on screen, for the calculator
    mathread: {effort: "low", out: 3000, routine: true},
    // Yes/no and tiny lookups: no thinking
    remote: {effort: "none", out: 800, routine: true}, quickadd: {effort: "none", out: 3000, routine: true},
    news: {effort: "none", out: 4000, routine: true}, annintel: {effort: "none", out: 2000, routine: true},
    classify: {effort: "none", out: 2000, routine: true}, triage: {effort: "none", out: 2500, routine: true},
    tag: {effort: "none", out: 1000, routine: true}, line: {effort: "none", out: 2000, routine: true},
    // A short description of a whiteboard picture or drawing, so Ask can find it
    describe: {effort: "none", out: 1200, routine: true},
    ping: {effort: "none", out: 400, routine: true}
  };
  // A job the app doesn't name
  const DEFAULT_TASK = {effort: "medium", out: 8000, routine: true};
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function taskOf(name, soft){
    const t = own(TASKS, name) ? TASKS[name] : DEFAULT_TASK;
    // Past the soft limit, routine jobs think less (never more)
    const effort = soft && t.routine && (t.effort === "medium" || t.effort === "high") ? "low" : t.effort;
    return {name: own(TASKS, name) ? name : "other", effort, out: t.out};
  }

  // Limits per student, each clamped to a range settings can't widen. env: the Worker's settings ({} gives the defaults).
  const HARD = {monthUsd: 10, dayUsd: 3, perMinute: 60, inflight: 8};
  const num = (v, d, lo, hi) => { const n = Number(v); return v != null && String(v).trim() !== "" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  // Money is kept in whole micro-dollars (integers), always rounded up
  const micro = usd => Math.max(0, Math.ceil(usd * 1e6 - 1e-6));
  function limits(env){
    env = env || {};
    // Defaults keep a student's real cost near $2.50 a month: $2.25 of AI, plus Washington sales tax (about 10%).
    // Claude is paid with Studyboard's own Anthropic key in the gateway, so there's no 5% credit fee on it.
    const hard = num(env.MONTHLY_HARD_USD, 2.25, 0, HARD.monthUsd), soft = Math.min(hard, num(env.MONTHLY_SOFT_USD, 1.8, 0, HARD.monthUsd));
    const day = num(env.DAILY_USD, 0.4, 0.05, HARD.dayUsd);
    return {softUsd: soft, hardUsd: hard, dayUsd: day, monthMicro: micro(hard), softMicro: micro(soft), dayMicro: micro(day),
      perMinute: Math.floor(num(env.PER_MINUTE, 20, 1, HARD.perMinute)), inflight: Math.floor(num(env.MAX_INFLIGHT, 4, 1, HARD.inflight))};
  }
  const monthOf = now => new Date(now).toISOString().slice(0, 7);
  const dayOf = now => new Date(now).toISOString().slice(0, 10);
  const nextMonth = now => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); };

  // What a finished request cost, from Anthropic's usage report
  function costOf(u){
    const n = k => Math.max(0, Number(u && u[k]) || 0);
    const inT = n("input_tokens"), cw = n("cache_creation_input_tokens"), cr = n("cache_read_input_tokens"), out = n("output_tokens");
    const mult = inT + cw + cr > LONG_PROMPT ? LONG_MULT : 1;
    const searches = Math.max(0, Number(u && u.server_tool_use && u.server_tool_use.web_search_requests) || 0);
    return micro(mult * (inT * PRICE.in + cw * PRICE.cacheWrite + cr * PRICE.cacheRead + out * PRICE.out) + searches * WEB.perSearch);
  }
  // The worst a request can cost: every input token written to the cache, and the whole output cap used
  const worstCost = (inTok, outCap) => micro((inTok > LONG_PROMPT ? LONG_MULT : 1) * (inTok * PRICE.cacheWrite + outCap * PRICE.out));
  // The worst a web lookup can cost: every round of the tool loop reads the prompt plus everything fetched so far
  function webWorst(inTok, outCap, web){
    const uses = (web.search ? WEB.searchUses : 0) + (web.fetch ? WEB.fetchUses : 0);
    const perRound = inTok + (web.search ? WEB.searchUses * WEB.searchTokens : 0) + (web.fetch ? WEB.fetchUses * WEB.fetchTokens : 0);
    return micro((uses + 1) * perRound * PRICE.cacheWrite * (perRound > LONG_PROMPT ? LONG_MULT : 1) + outCap * PRICE.out + (web.search ? WEB.searchUses * WEB.perSearch : 0));
  }
  // A UTF-8 byte is never split across two tokens, so a text's byte count is never below its token count
  const textBytes = s => new TextEncoder().encode(String(s || "")).length;

  // One call at a time, in order of arrival
  const serial = () => { let q = Promise.resolve(); return fn => { const run = q.then(fn, fn); q = run.catch(() => {}); return run; }; };
  /* One student's allowance. storage: {get(k), put(k, v) or put({k: v}), deleteAll()}, all async (a Durable Object's storage on
     the Worker; the device's storage for a student's own key). Each call reads and writes with nothing in between, one at a time,
     so two jobs can never both pass a check that only one fits. lock: optional, wraps each call (the app uses a cross-tab lock). */
  class Meter {
    // o (on a device only): {sid: this page's id, alive: sid => is that page still open}. A job started by a page that has
    // closed or reloaded can't still be running, so it stops counting as in flight at once (its charge stays).
    constructor(storage, now = () => Date.now(), lock = null, o = null){ this.s = storage; this.now = now; this.o = o || {}; const one = serial(); this.one = lock ? fn => one(() => lock(fn)) : one; }
    async read(){
      const keys = ["gone", "month", "spent", "day", "daySpent", "flying", "hits"], v = await Promise.all(keys.map(k => this.s.get(k)));
      const [gone, month, spent, day, daySpent, flying, hits] = v, now = this.now(), m = monthOf(now), d = dayOf(now);
      return {gone: !!gone, now, month: m, spent: month === m ? spent || 0 : 0, day: d, daySpent: day === d ? daySpent || 0 : 0,
        // A job that never settled (its Worker or tab stopped) stays charged; after 15 minutes it stops counting as in flight
        flying: (flying || []).filter(f => now - f.at < 15 * 60000 && (!this.o.alive || this.o.alive(f.sid))), hits: (hits || []).filter(t => now - t < 60000)};
    }
    reserve(cost, lim){ return this.one(() => this._reserve(cost, lim)); }
    settle(id, actual){ return this.one(() => this._settle(id, actual)); }
    status(lim){ return this.one(() => this._status(lim)); }
    touch(lim){ return this.one(() => this._touch(lim)); }
    forget(){ return this.one(() => this._forget()); }
    // A count per calendar month (UTC), such as YouTube videos: take one if fewer than max are used, give it back if the job failed
    take(name, max){ return this.one(() => this._take(name, max)); }
    give(name){ return this.one(() => this._give(name)); }
    used(name){ return this.one(async () => { const c = await this._counts(); return c.n[name] || 0; }); }
    async _counts(){ const c = (await this.s.get("counts")) || {}, m = monthOf(this.now()); return c.month === m ? {month: m, n: c.n || {}} : {month: m, n: {}}; }
    async _take(name, max){
      if ((await this.s.get("gone"))) return false;
      const c = await this._counts(); if ((c.n[name] || 0) >= max) return false;
      c.n[name] = (c.n[name] || 0) + 1; await this.s.put("counts", c); return true;
    }
    // For the owner: this student's month so far, in micro-dollars and counts (never anything they sent)
    summary(lim){ return this.one(async () => { const r = await this.read(), c = await this._counts(); return {gone: r.gone, month: r.month, spent: r.spent, day: r.day, daySpent: r.daySpent, inFlight: r.flying.length, counts: c.n, ...this.view(r, lim)}; }); }
    async _give(name){ const c = await this._counts(); if (c.n[name] > 0) { c.n[name]--; await this.s.put("counts", c); } return true; }
    // A free call made for the student (Anthropic's token count) still counts toward their requests a minute
    async _touch(lim){
      const r = await this.read();
      if (r.gone || r.hits.length >= lim.perMinute) return false;
      r.hits.push(r.now); await this.s.put("hits", r.hits);
      return true;
    }
    async _reserve(cost, lim){
      if (!Number.isFinite(cost) || cost < 0) return {ok: false, reason: "bad"};
      const r = await this.read();
      if (r.gone) return {ok: false, reason: "gone"};
      if (r.hits.length >= lim.perMinute || r.flying.length >= lim.inflight) return {ok: false, reason: "rate"};
      if (r.spent + cost > lim.monthMicro) return {ok: false, reason: "used_up", ...this.view(r, lim)};
      if (r.daySpent + cost > lim.dayMicro) return {ok: false, reason: "today", ...this.view(r, lim)};
      const id = crypto.randomUUID();
      r.flying.push(Object.assign({id, at: r.now, cost, month: r.month, day: r.day}, this.o.sid ? {sid: this.o.sid} : {})); r.hits.push(r.now);
      await this.s.put({month: r.month, spent: r.spent + cost, day: r.day, daySpent: r.daySpent + cost, flying: r.flying, hits: r.hits});
      return {ok: true, id};
    }
    // Replace a reservation with what the job really cost (never more than 4 times the reservation; a garbled amount keeps it)
    async _settle(id, actual){
      const r = await this.read(), all = (await this.s.get("flying")) || [], f = all.find(x => x.id === id);
      if (!f || r.gone) return false;
      const real = Number.isFinite(actual) ? Math.max(0, Math.min(Math.ceil(actual), f.cost * 4)) : f.cost, delta = real - f.cost;
      const upd = {flying: r.flying.filter(x => x.id !== id)};
      if (f.month === r.month) upd.spent = Math.max(0, r.spent + delta);
      if (f.day === r.day) upd.daySpent = Math.max(0, r.daySpent + delta);
      await this.s.put(upd);
      return true;
    }
    view(r, lim){ return {usedPct: lim.monthMicro > 0 ? Math.min(100, Math.round(r.spent / lim.monthMicro * 100)) : 100, dayPct: lim.dayMicro > 0 ? Math.min(100, Math.round(r.daySpent / lim.dayMicro * 100)) : 100, soft: r.spent >= lim.softMicro, resets: nextMonth(r.now)}; }
    async _status(lim){ const r = await this.read(); return r.gone ? {usedPct: 100, soft: false, resets: null, gone: true} : this.view(r, lim); }
    // Delete My Account: the id is closed for good, so deleting can't be used to reset an allowance
    async _forget(){ await this.s.deleteAll(); await this.s.put("gone", true); }
  }

  // The app's answer shapes, made strict for structured outputs: only the keywords the API supports, every object closed
  const KEEP = new Set(["type", "properties", "items", "required", "enum", "description"]);
  function strictSchema(s, depth = 0){
    if (depth > 12) throw new Error("schema_deep");
    if (!s || typeof s !== "object" || Array.isArray(s)) throw new Error("schema_bad");
    const o = {};
    for (const [k, v] of Object.entries(s)) {
      if (!KEEP.has(k)) continue;
      if (k === "type") { const t = String(v).toLowerCase(); if (!["object", "array", "string", "integer", "number", "boolean"].includes(t)) throw new Error("schema_bad"); o.type = t; }
      else if (k === "properties") { if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("schema_bad"); o.properties = {}; for (const [pk, pv] of Object.entries(v)) o.properties[String(pk).slice(0, 64)] = strictSchema(pv, depth + 1); }
      else if (k === "items") o.items = strictSchema(v, depth + 1);
      else if (k === "required") o.required = Array.isArray(v) ? v.filter(x => typeof x === "string").slice(0, 64) : undefined;
      else if (k === "enum") o.enum = Array.isArray(v) ? v.filter(x => typeof x === "string" || typeof x === "number").slice(0, 100) : undefined;
      else if (k === "description") o.description = String(v).slice(0, 500);
    }
    if (!o.type) o.type = o.properties ? "object" : "string";
    if (o.type === "object") { o.properties = o.properties || {}; o.additionalProperties = false; if (o.required) o.required = o.required.filter(r => own(o.properties, r)); }
    if (o.type === "array" && !o.items) o.items = {type: "string"};
    Object.keys(o).forEach(k => o[k] === undefined && delete o[k]);
    return o;
  }

  // The content a job may send: text, images and PDFs, nothing else (no tools, URLs, files by id or server-side fetches)
  const IMG = /^image\/(png|jpeg|gif|webp)$/, B64 = /^[A-Za-z0-9+/]*={0,2}$/;
  function readBlocks(blocks){
    if (!Array.isArray(blocks) || !blocks.length || blocks.length > MAX_BLOCKS) throw new Error("bad");
    let text = 0, media = 0, guess = 0;
    const out = blocks.map(b => {
      if (!b || typeof b !== "object") throw new Error("bad");
      if (b.type === "text" && typeof b.text === "string") { text += textBytes(b.text); return {type: "text", text: b.text}; }
      const src = b.source || {};
      if (src.type !== "base64" || typeof src.data !== "string" || !src.data || src.data.length % 4 !== 0 || !B64.test(src.data)) throw new Error("bad");
      if (b.type === "image" && IMG.test(src.media_type)) { media++; guess += IMAGE_TOKENS; return {type: "image", source: {type: "base64", media_type: src.media_type, data: src.data}}; }
      if (b.type === "document" && src.media_type === "application/pdf") { media++; guess += pdfPages(src.data) * PDF_PAGE_TOKENS; return {type: "document", source: {type: "base64", media_type: "application/pdf", data: src.data}}; }
      throw new Error("bad");
    });
    if (!out.some(b => b.type === "text" ? b.text.trim() : true)) throw new Error("bad");
    return {blocks: out, textBytes: text, media, mediaGuess: guess};
  }
  // Pages in a PDF, counted from its "/Type /Page" entries (at least 1); used only when Anthropic can't count the file
  function pdfPages(b64){
    let s = ""; try { s = atob(b64); } catch (e) { return 1000; }
    const m = s.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
    return Math.max(1, m ? m.length : 1);
  }

  // The request sent to Anthropic. Only this builds it, from the choices above.
  function buildRequest({system, blocks, schema, task, cacheMedia, web}){
    let sys = String(system || "").trim();
    // Web tools answer in text, so the answer shape goes into the instructions
    if (web && (web.search || web.fetch) && schema) { sys = `${sys}\n\nReply with one JSON object only, no other text. It must match this JSON Schema:\n${JSON.stringify(schema)}`.trim(); schema = null; }
    const req = {model: MODEL, max_tokens: task.out, messages: [{role: "user", content: blocks.map(b => Object.assign({}, b))}]};
    // Prompt caching: system prompts are the same for every student, so they stay warm. Under 2,000 characters they're
    // shorter than the minimum that can be cached, so they're sent plain.
    if (sys) req.system = sys.length >= 2000 ? [{type: "text", text: sys, cache_control: {type: "ephemeral"}}] : sys;
    // Follow-up questions about the same files reuse them from the cache
    if (cacheMedia) { const c = req.messages[0].content; let last = -1; c.forEach((b, i) => { if (b.type !== "text") last = i; }); if (last >= 0) c[last] = Object.assign({}, c[last], {cache_control: {type: "ephemeral"}}); }
    if (task.effort === "none") { req.thinking = {type: "disabled"}; req.output_config = {effort: "low"}; }
    else { req.thinking = {type: "adaptive"}; req.output_config = {effort: task.effort}; }
    if (schema) req.output_config.format = {type: "json_schema", schema};
    if (web && (web.search || web.fetch)) {
      req.tools = [];
      if (web.search) req.tools.push({type: "web_search_20250305", name: "web_search", max_uses: WEB.searchUses});
      if (web.fetch) req.tools.push({type: "web_fetch_20250910", name: "web_fetch", max_uses: WEB.fetchUses, max_content_tokens: WEB.fetchTokens});
    }
    return req;
  }
  // The answer: JSON from the text blocks (thinking blocks are skipped)
  function readAnswer(msg){
    const t = ((msg && msg.content) || []).filter(b => b && b.type === "text").map(b => b.text || "").join("").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    try { const d = JSON.parse(t); if (d && typeof d === "object") return d; } catch (e) { }
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) { try { const d = JSON.parse(t.slice(a, b + 1)); if (d && typeof d === "object") return d; } catch (e) { } }
    return null;
  }
  // An error with an HTTP status was refused before any work, so nothing was billed. Anything else
  // (a timeout, a dropped connection) may have been billed, so its reservation is kept.
  const refusedEarly = e => !!e && Number.isInteger(e.status) && e.status >= 400;

  /* Totals for the owner: one day's usage, added up from the providers' usage reports. Counts only, never content.
     storage: like Meter's. Each add happens on its own, one at a time. */
  class Totals {
    constructor(storage){ this.s = storage; this.one = serial(); }
    add(kind, task, usage, cost){ return this.one(() => this._add(kind, task, usage, cost)); }
    async _add(kind, task, usage, cost){
      const t = (await this.s.get("t")) || {jobs: 0, cost: 0, kinds: {}, tasks: {}};
      const n = k => Math.max(0, Number(usage && usage[k]) || 0);
      const k = t.kinds[kind] || (t.kinds[kind] = {jobs: 0, cost: 0, unreported: 0, input: 0, cacheWrite: 0, cacheRead: 0, output: 0, searches: 0});
      k.jobs++; k.cost += Math.max(0, cost || 0); t.jobs++; t.cost += Math.max(0, cost || 0);
      if (!usage) k.unreported++;
      else { k.input += n("input_tokens"); k.cacheWrite += n("cache_creation_input_tokens"); k.cacheRead += n("cache_read_input_tokens"); k.output += n("output_tokens");
        k.searches += Math.max(0, Number(usage.server_tool_use && usage.server_tool_use.web_search_requests) || 0);
        if (usage.audio_seconds != null) k.audioSeconds = (k.audioSeconds || 0) + n("audio_seconds"); }
      if (task) { const tk = String(task).slice(0, 24), x = t.tasks[tk] || (t.tasks[tk] = {jobs: 0, cost: 0}); x.jobs++; x.cost += Math.max(0, cost || 0); }
      await this.s.put("t", t);
      return true;
    }
    async read(){ return (await this.s.get("t")) || {jobs: 0, cost: 0, kinds: {}, tasks: {}}; }
  }

  /* One Claude job, start to finish: check it, pick the model and thinking, count it, charge its worst case, run it, settle.
     job: what the app sends ({task, system, content, schema, search, urlContext}).
     ctx: {meter, lim, claude: {create(req), count(req)}, defer(promise)?}. Returns {status, body}: the Worker sends it as is,
     and the app reads it the same way for a student's own key. */
  async function runJob(job, ctx){
    const {meter, lim, claude} = ctx, view = async () => meter.status(lim);
    if (!job || typeof job !== "object") return {status: 400, body: {error: "bad"}};
    // Background jobs always leave one job slot and 5 requests a minute for what the student asks for themselves
    const limJob = job.auto === true ? Object.assign({}, lim, {perMinute: Math.max(1, lim.perMinute - 5), inflight: Math.max(1, lim.inflight - 1)}) : lim;
    let read, schema = null;
    try { read = readBlocks(job.content); } catch (e) { return {status: 400, body: {error: "bad"}}; }
    if (job.schema != null) {
      if (JSON.stringify(job.schema).length > MAX_SCHEMA_CHARS) return {status: 413, body: {error: "too_long"}};
      try { schema = strictSchema(job.schema); } catch (e) { return {status: 400, body: {error: "bad"}}; }
    }
    const system = typeof job.system === "string" ? job.system : "";
    if (textBytes(system) > MAX_SYSTEM_BYTES) return {status: 413, body: {error: "too_long"}};
    const soft = (await view()).soft;
    let task = taskOf(String(job.task || "").slice(0, 40), soft);
    // Automatic jobs (the ones the app runs in the background) can be given more thinking than their usual level
    // (the Worker raises them to medium for paid Pro), never past the soft limit, and never less than they had
    const RANK = {none: 0, low: 1, medium: 2, high: 3};
    if (job.auto === true && ctx.autoEffort && RANK[ctx.autoEffort] != null && !soft && RANK[ctx.autoEffort] > RANK[task.effort]) task = {name: task.name, effort: ctx.autoEffort, out: Math.max(task.out, 4000)};
    const cacheMedia = (task.name === "tutor" || task.name === "chat") && read.media > 0;
    const web = {search: job.search === true, fetch: job.urlContext === true}, onWeb = web.search || web.fetch;
    const req = buildRequest({system, blocks: read.blocks, schema, task, cacheMedia, web});
    // Input tokens: an upper bound from the bytes for plain text; Anthropic's own count when files are attached or the text is
    // long (so a long prompt isn't refused on an estimate). If the count can't be had, a generous estimate for the files.
    const bound = textBytes(system) + read.textBytes + (schema ? JSON.stringify(schema).length : 0) + FRAME_TOKENS;
    let inTok = bound;
    if (read.media || bound > MAX_INPUT_TOKENS) {
      if (!(await meter.touch(limJob))) return {status: 429, body: Object.assign({error: "rate"}, await view())};
      let counted = NaN;
      try { counted = await claude.count(req); } catch (e) { counted = NaN; }
      inTok = Number.isFinite(counted) && counted > 0 ? counted + 200 : bound + read.mediaGuess;
    }
    if (inTok > MAX_INPUT_TOKENS || (onWeb && inTok > WEB.maxInput + FRAME_TOKENS)) return {status: 413, body: {error: "too_long", tokens: inTok}};
    // Charge the worst case first
    const reserve = onWeb ? webWorst(inTok, task.out, web) : worstCost(inTok, task.out);
    const got = await meter.reserve(reserve, limJob);
    if (!got.ok) return {status: got.reason === "rate" ? 429 : 402, body: Object.assign({error: got.reason}, await view())};
    // The model runs on its own promise, kept alive if the app hangs up, so the charge is always corrected
    let spent = null;
    const work = (async () => {
      let msg = null, cost = reserve;
      try { msg = await claude.create(req); cost = msg && msg.usage ? costOf(msg.usage) : reserve; }
      catch (e) {
        cost = refusedEarly(e) ? 0 : reserve; msg = {error: e};
        // An answer shape the API won't compile: once more, with the shape written into the instructions instead
        if (!onWeb && e && e.status === 400 && schema) {
          const plain = buildRequest({system: `${system}\n\nReply with one JSON object only, no other text. It must match this JSON Schema:\n${JSON.stringify(schema)}`, blocks: read.blocks, schema: null, task, cacheMedia});
          try { msg = await claude.create(plain); cost = msg && msg.usage ? costOf(msg.usage) : reserve; }
          catch (e2) { cost = refusedEarly(e2) ? 0 : reserve; msg = {error: e2}; }
        }
      }
      await meter.settle(got.id, cost);
      spent = {task: task.name, usage: msg && msg.usage ? msg.usage : null, cost};
      return msg;
    })();
    if (ctx.defer) ctx.defer(work);
    const msg = await work, after = await view(), done = r => Object.assign(r, {spent});
    if (msg.error) { const s = msg.error && msg.error.status; return done({status: s === 400 ? 400 : s === 401 || s === 403 ? 401 : 503, body: Object.assign({error: s === 429 || s === 529 || (s >= 500 && s < 600) ? "busy" : s === 400 ? "bad" : s === 401 || s === 403 ? "key" : "ai_failed"}, after)}); }
    if (msg.stop_reason === "refusal") return done({status: 422, body: Object.assign({error: "refused"}, after)});
    const data = readAnswer(msg);
    if (!data) return done({status: 502, body: Object.assign({error: "ai_failed", truncated: msg.stop_reason === "max_tokens"}, after)});
    // spent: what this job really used and cost (for the owner's totals), never sent to the student
    return done({status: 200, body: Object.assign({data, model: "Studyboard AI", truncated: msg.stop_reason === "max_tokens"}, after)});
  }

  return {MODEL, PRICE, LONG_PROMPT, LONG_MULT, MAX_INPUT_TOKENS, FRAME_TOKENS, MAX_SCHEMA_CHARS, MAX_BLOCKS, WEB, IMAGE_TOKENS, PDF_PAGE_TOKENS,
    TASKS, DEFAULT_TASK, HARD, taskOf, limits, micro, monthOf, dayOf, nextMonth, costOf, worstCost, webWorst, textBytes, Meter, Totals,
    strictSchema, readBlocks, pdfPages, buildRequest, readAnswer, refusedEarly, runJob};
})();
globalThis.SBPOLICY = SBPOLICY;
