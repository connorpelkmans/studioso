// Unit tests for Studyboard Pro AI (cloudflare/ai-pro/src/pro.js): every limit, and every way around one we could think of
const path = require("path"), assert = require("assert"), {pathToFileURL} = require("url");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

(async () => {
  const P = await import(pathToFileURL(path.join(__dirname, "..", "cloudflare", "ai-pro", "src", "pro.js")).href);
  // Storage like a Durable Object's, but every call waits a tick so interleaving would show
  const tick = () => new Promise(r => setTimeout(r, 0));
  const mem = () => { const m = new Map(); let alarm = null; return {m,
    get: async k => { await tick(); return m.get(k); },
    put: async (k, v) => { await tick(); if (typeof k === "object") Object.entries(k).forEach(([x, y]) => m.set(x, y)); else m.set(k, v); },
    deleteAll: async () => { await tick(); m.clear(); }, getAlarm: async () => alarm, setAlarm: async t => { alarm = t; }}; };
  const ENV = {CF_ACCOUNT_ID: "acct", AI_GATEWAY_ID: "gw", CF_AIG_TOKEN: "cf-token", SUPABASE_URL: "https://x.supabase.co", SUPABASE_KEY: "pk"};

  /* Settings can't be raised past the hard ranges */
  eq(P.config({}).on, false, "off without the gateway settings");
  eq(P.config({ANTHROPIC_API_KEY: "sk-ant-x"}).on, false, "an Anthropic key alone doesn't turn it on (it never uses one)");
  eq(P.config(ENV).on, true, "on with the account, gateway and gateway token");
  eq(P.config({...ENV, CF_AIG_TOKEN: ""}).on, false, "not without the gateway token");
  eq(P.config({...ENV, PRO_AI_OFF: "1"}).on, false, "PRO_AI_OFF turns it off");
  const wild = P.limits({MONTHLY_HARD_USD: "500", MONTHLY_SOFT_USD: "900", DAILY_USD: "99", PER_MINUTE: "5000", MAX_INFLIGHT: "999"});
  ok(wild.hardUsd <= P.HARD.monthUsd && wild.softUsd <= wild.hardUsd && wild.dayUsd <= P.HARD.dayUsd && wild.perMinute <= P.HARD.perMinute && wild.inflight <= P.HARD.inflight, "a mistyped setting can't lift the limits past their hard ranges");
  eq([P.limits({MONTHLY_HARD_USD: "abc"}).hardUsd, P.limits({MONTHLY_HARD_USD: "-3"}).hardUsd], [2.25, 0], "a bad value falls back to the default; a negative one means no AI");
  const L0 = P.limits({});
  eq([L0.softUsd, L0.hardUsd, L0.dayUsd, L0.perMinute, L0.inflight], [1.8, 2.25, 0.9, 20, 4], "defaults: $1.80 soft, $2.25 hard a month (about $2.50 with tax), $0.90 a day, 20 a minute, 4 at once");
  ok(!("globalDayUsd" in L0) && !("trialUsd" in L0), "no limit shared across students, and nothing for a free week");
  const src = require("fs").readFileSync(path.join(__dirname, "..", "cloudflare", "ai-pro", "src", "pro.js"), "utf8");
  ok(src.includes('import "../../../src/js/01-ai-policy.js"') && !/\bconst TASKS\b|\bfunction buildRequest\b/.test(src), "the Worker uses the app's own rules file, not a copy");
  ok(globalThis.SBPOLICY && globalThis.SBPOLICY.TASKS === P.TASKS && globalThis.SBPOLICY.buildRequest === P.buildRequest, "the very same rules object");

  /* Plans: only a Pro plan someone pays for */
  const now0 = Date.UTC(2026, 10, 4, 12), later = new Date(now0 + 86400000).toISOString(), past = new Date(now0 - 86400000).toISOString();
  eq(P.tierOf({plan: "pro", pro_until: later}, now0), "paid", "paid Pro");
  eq(P.tierOf({plan: "pro", pro_until: null}, now0), "paid", "Pro with no end date");
  eq(P.tierOf({plan: "lifetime"}, now0), "paid", "lifetime");
  eq(P.tierOf({plan: "pro", pro_until: past}, now0), "none", "lapsed Pro gets nothing");
  eq(P.tierOf({plan: "free", promo_until: later, promo_lifetime: true}, now0), "none", "Pro from a promo code: no Studyboard AI");
  eq(P.tierOf({plan: "free", grant_lifetime: true, grant_until: later}, now0), "none", "Pro from a server grant: no Studyboard AI");
  eq(P.tierOf({plan: "free", trial_until: later}, now0), "none", "the free week: no Studyboard AI");
  eq([P.tierOf(null), P.tierOf(undefined), P.tierOf({plan: "free"}), P.tierOf({plan: "pro", pro_until: "not a date"}, now0)], ["none", "none", "none", "none"], "no row, a free row, or a garbled date: nothing");

  /* The server picks the thinking level and the output cap */
  eq(P.taskOf("grade").effort, "high", "grading thinks hard");
  eq(P.taskOf("tutor").effort, "high", "Ask About Course and Teach It Back think hard");
  eq(P.taskOf("chat").effort, "medium", "chat thinks at medium");
  eq(P.taskOf("plan").effort, "medium", "the automatic plan thinks at medium");
  eq(P.taskOf("plan", true).effort, "low", "and at low past the soft limit");
  eq(P.taskOf("remote").effort, "none", "yes/no jobs don't think");
  eq(P.taskOf("rubric", true).effort, "high", "past the soft limit, hard jobs keep their level");
  eq(P.taskOf("chat", true).effort, "low", "past the soft limit, routine jobs drop to low");
  eq(P.taskOf("remote", true).effort, "none", "and jobs that don't think still don't");
  for (const bad of ["__proto__", "constructor", "toString", "hasOwnProperty", "", "x".repeat(500), "GRADE"]) eq(P.taskOf(bad).name, "other", `an unknown job name (${bad.slice(0, 12) || "empty"}) gets the default`);
  ok(Object.values(P.TASKS).every(t => ["none", "low", "medium", "high"].includes(t.effort) && t.out > 0 && t.out <= 32000), "no job can use xhigh/max or an output cap over 32,000");

  /* Prices: what we charge first is never less than what the job can cost */
  eq(P.costOf({input_tokens: 1e5, output_tokens: 0}), 10000, "100K input tokens = $0.01");
  eq(P.costOf({input_tokens: 0, output_tokens: 1e6}), 500000, "1M output tokens = $0.50");
  eq(P.costOf({input_tokens: 0, cache_read_input_tokens: 1e5}), 1000, "cache reads at a tenth");
  eq(P.costOf({input_tokens: 0, cache_creation_input_tokens: 1e5}), 12500, "cache writes at 1.25x");
  eq(P.costOf({input_tokens: 100001, output_tokens: 0}), Math.ceil(100001 * 0.5), "over 100K tokens a prompt is priced on the long rate card");
  eq(P.costOf({input_tokens: -5, output_tokens: "x"}), 0, "garbled usage can't make a negative charge");
  let worstOk = true;
  for (let i = 0; i < 2000; i++) {
    const inTok = Math.floor(Math.random() * P.MAX_INPUT_TOKENS), out = 1 + Math.floor(Math.random() * 32000);
    const a = Math.floor(Math.random() * inTok), b = Math.floor(Math.random() * (inTok - a)), c = inTok - a - b, o = Math.floor(Math.random() * out);
    if (P.costOf({input_tokens: a, cache_creation_input_tokens: b, cache_read_input_tokens: c, output_tokens: o}) > P.worstCost(inTok, out)) worstOk = false;
  }
  ok(worstOk, "for any split of input between cache reads, writes and plain, and any output under the cap, the real cost never beats the reservation");
  ok(P.textBytes("日本語") === 9 && P.textBytes("abc") === 3, "the text bound counts UTF-8 bytes (each a token at most)");
  ok(P.audioWorst(1048576) >= P.audioCost(1048576 * 8 / 8000), "an audio reservation covers the longest a file that size could play at 8 kbit/s");

  /* Answer shapes become strict */
  const sch = P.strictSchema({type: "OBJECT", properties: {a: {type: "STRING", minLength: 3, pattern: ".*"}, b: {type: "ARRAY", items: {type: "OBJECT", properties: {c: {type: "NUMBER", minimum: 0}}, required: ["c", "zzz"]}}}, required: ["a"], additionalProperties: true, $ref: "#/x"});
  eq(sch, {type: "object", properties: {a: {type: "string"}, b: {type: "array", items: {type: "object", properties: {c: {type: "number"}}, required: ["c"], additionalProperties: false}}}, required: ["a"], additionalProperties: false}, "unsupported keywords dropped, every object closed, unknown required names dropped");
  let deep = {type: "STRING"}; for (let i = 0; i < 20; i++) deep = {type: "ARRAY", items: deep};
  let threw = false; try { P.strictSchema(deep); } catch (e) { threw = true; } ok(threw, "a schema nested 20 deep is refused");
  threw = false; try { P.strictSchema({type: "null"}); } catch (e) { threw = true; } ok(threw, "an unknown type is refused");

  /* Content: text, images and PDFs only */
  const img = {type: "image", source: {type: "base64", media_type: "image/png", data: "iVBORw0KGgo="}};
  eq(P.readBlocks([{type: "text", text: "hi"}, img]).media, 1, "text and an image");
  const refuse = (blocks, m) => { let t = false; try { P.readBlocks(blocks); } catch (e) { t = true; } ok(t, m); };
  refuse([{type: "image", source: {type: "url", url: "https://evil.example/x.png"}}], "an image by URL is refused (no server-side fetches)");
  refuse([{type: "document", source: {type: "file", file_id: "file_1"}}], "a file by id is refused");
  refuse([{type: "tool_use", id: "x", name: "web_search", input: {}}], "a tool block is refused");
  refuse([{type: "document", source: {type: "text", media_type: "text/plain", data: "x"}}], "a plain-text document source is refused");
  refuse([{type: "image", source: {type: "base64", media_type: "image/svg+xml", data: "AAAA"}}], "an SVG is refused");
  refuse([{type: "image", source: {type: "base64", media_type: "image/png", data: "not base64!"}}], "data that isn't base64 is refused");
  refuse([{type: "text", text: "   "}], "nothing but blank text is refused");
  refuse(Array.from({length: 41}, () => ({type: "text", text: "x"})), "more than 40 blocks is refused");
  refuse([], "no content is refused");
  const kept = P.readBlocks([{type: "text", text: "hi", cache_control: {type: "ephemeral", ttl: "1h"}, citations: {enabled: true}}]).blocks[0];
  eq(kept, {type: "text", text: "hi"}, "extra fields on a block (an hour-long cache, citations) are dropped");

  /* The request to Anthropic is built only from the server's choices */
  const tk = P.taskOf("remote"), req = P.buildRequest({system: "s".repeat(2500), blocks: [{type: "text", text: "q"}], schema: {type: "object", properties: {}, additionalProperties: false}, task: tk});
  eq(req.model, "claude-haiku-5-5", "always Haiku 5.5");
  eq([req.thinking, req.output_config.effort, req.max_tokens], [{type: "disabled"}, "low", 800], "a yes/no job: thinking off, low effort, its own cap");
  ok(!("temperature" in req) && !("tools" in req) && !("top_p" in req) && !("top_k" in req), "no sampling settings or tools, ever");
  eq(req.system[0].cache_control, {type: "ephemeral"}, "a long system prompt is cached (5 minutes)");
  eq(typeof P.buildRequest({system: "short", blocks: [{type: "text", text: "q"}], task: P.taskOf("chat")}).system, "string", "a short one isn't marked");
  const hi = P.buildRequest({system: "", blocks: [img, {type: "text", text: "q"}], task: P.taskOf("tutor"), cacheMedia: true});
  eq([hi.thinking, hi.output_config.effort, hi.messages[0].content[0].cache_control], [{type: "adaptive"}, "high", {type: "ephemeral"}], "a tutor job thinks hard and caches its files for follow-ups");

  /* One student's meter */
  let now = Date.UTC(2026, 10, 4, 12);
  // the meter's rules, with round numbers ($2 soft, $2.50 hard, $1 a day) so the arithmetic below is easy to follow
  const lim = P.limits({...ENV, MONTHLY_SOFT_USD: "2", MONTHLY_HARD_USD: "2.5", DAILY_USD: "1"}), st = new P.Meter(mem(), () => now);
  eq([lim.monthMicro, lim.softMicro, lim.dayMicro], [2.5e6, 2e6, 1e6], "limits in micro-dollars");
  let r = await st.reserve(500000, lim); ok(r.ok, "a $0.50 job fits");
  ok(await st.settle(r.id, 1000), "settled to its real cost");
  eq((await st.status(lim)).usedPct, 0, "a tenth of a cent rounds to 0%");
  ok(!(await st.settle(r.id, 0)), "a reservation can't be settled twice");
  ok(!(await st.settle("made-up", 0)), "nor an id that was never reserved");
  // The daily limit
  for (let i = 0; i < 4; i++) { const x = await st.reserve(240000, lim); ok(x.ok, `job ${i + 1} today`); await st.settle(x.id, 240000); }
  eq((await st.reserve(100000, lim)).reason, "today", "$1 a day: the next one waits for tomorrow");
  now += 86400000;
  ok((await st.reserve(100000, lim)).ok, "the next day it runs");
  // The monthly limit, across days
  const st2 = new P.Meter(mem(), () => now);
  for (let d = 0; d < 2; d++) { const x = await st2.reserve(1000000, lim); ok(x.ok, `day ${d + 1}`); await st2.settle(x.id, 1000000); now += 86400000; }
  const soft = await st2.status(lim); ok(soft.soft && soft.usedPct === 80, "past $2 the student is told routine jobs think less");
  ok((await st2.reserve(490000, lim)).ok, "up to $2.50 still runs");
  eq((await st2.reserve(20000, lim)).reason, "used_up", "$2.50 a month: refused until next month");
  now = Date.UTC(2026, 11, 1, 0, 0, 1);
  ok((await st2.reserve(100000, lim)).ok, "a new month starts a new allowance");
  // A job that never settles stays charged
  const st4 = new P.Meter(mem(), () => now), lost = await st4.reserve(600000, lim);
  ok(lost.ok, "a job whose Worker dies mid-way");
  now += 20 * 60000;
  eq((await st4.reserve(500000, lim)).reason, "today", "its reservation still counts after it stops counting as in flight");
  // A real cost can't be inflated without bound, or made negative
  const st5 = new P.Meter(mem(), () => now), q = await st5.reserve(1000, lim); await st5.settle(q.id, 1e12);
  eq((await st5.read()).spent, 4000, "a settle is capped at 4 times its reservation");
  const q2 = await st5.reserve(1000, lim); await st5.settle(q2.id, -1e9);
  eq((await st5.read()).spent, 4000, "and never goes below zero");
  const q3 = await st5.reserve(1000, lim); await st5.settle(q3.id, NaN);
  eq((await st5.read()).spent, 5000, "a garbled amount keeps the reservation");
  eq((await st5.reserve(-50, lim)).reason, "bad", "a negative reservation is refused");
  eq((await st5.reserve(NaN, lim)).reason, "bad", "and a garbled one");

  /* Racing: 50 jobs at once can't spend more than the limit */
  const race = new P.Meter(mem(), () => now), rl = {...lim, perMinute: 1000, inflight: 1000};
  const all = await Promise.all(Array.from({length: 50}, () => race.reserve(300000, rl)));
  eq(all.filter(x => x.ok).length, 3, "fifty $0.30 jobs at once: exactly three fit under $1 a day");
  ok((await race.read()).spent <= rl.dayMicro, "and nothing went over");
  // Rate and in-flight limits
  const rate = new P.Meter(mem(), () => now), rr = {...lim, perMinute: 5, inflight: 3};
  const fl = await Promise.all(Array.from({length: 6}, () => rate.reserve(10, rr)));
  eq(fl.filter(x => x.ok).length, 3, "at most 3 jobs in flight");
  await Promise.all(fl.filter(x => x.ok).map(x => rate.settle(x.id, 10)));
  eq([(await rate.reserve(10, rr)).ok, (await rate.reserve(10, rr)).ok], [true, true], "two more in the same minute");
  eq((await rate.reserve(10, rr)).reason, "rate", "the sixth in a minute waits");
  now += 61000;
  ok((await rate.reserve(10, rr)).ok, "a minute later it runs");
  // Delete My Account closes the id for good
  const del = new P.Meter(mem(), () => now); await del.reserve(2400000, {...lim, dayMicro: 4e6});
  await del.forget();
  eq((await del.reserve(1, lim)).reason, "gone", "a deleted account's id can't be used to get a fresh allowance");
  /* The whole request path, with a fake Anthropic */
  now = Date.UTC(2027, 0, 15, 12);
  // Spending from earlier days this month (so the daily limit doesn't get in the way)
  const spendBefore = async (m, amount) => { const save = now; now -= 2 * 86400000; const r = await m.reserve(amount, {...lim, dayMicro: 9e6}); await m.settle(r.id, amount); now = save; };
  function harness(over = {}){
    const meters = new Map(), totals = new Map(), calls = [], counts = [];
    const H = {calls, counts, deferred: [],
      tier: "paid", user: {id: "0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", confirmed: true, anonymous: false},
      reply: req => ({content: [{type: "thinking", thinking: ""}, {type: "text", text: JSON.stringify({ok: 1})}], stop_reason: "end_turn", usage: {input_tokens: 1000, output_tokens: 200}}),
      count: () => 5000, now: () => now};
    Object.assign(H, over);
    H.deps = {
      user: async t => t === "good" ? H.user : null,
      plan: async () => H.tier,
      meter: id => { if (!meters.has(id)) meters.set(id, new P.Meter(mem(), H.now)); return meters.get(id); },
      totals: d => { if (!totals.has(d)) totals.set(d, new P.Totals(mem())); return totals.get(d); }, totalsMap: totals,
      claude: {create: async req => { calls.push(JSON.parse(JSON.stringify(req))); const x = H.reply(req); if (x instanceof Error) throw x; return x; }, count: async req => { counts.push(req); return H.count(req); }},
      whisper: async bytes => H.whisper ? H.whisper(bytes) : {text: " hello ", transcription_info: {duration: 30}},
      defer: p => H.deferred.push(p), now: H.now};
    H.meterOf = () => H.deps.meter(H.user.id);
    return H;
  }
  const call = (H, body, opts = {}) => P.handle(new Request("https://w.example" + (opts.path || "/v1/ai"), {method: opts.method || "POST", headers: Object.assign({Authorization: "Bearer " + (opts.token || "good"), "Content-Type": "application/json"}, opts.headers || {}), body: opts.method === "GET" || opts.method === "DELETE" ? undefined : (typeof body === "string" || body instanceof Uint8Array ? body : JSON.stringify(body))}), opts.env || ENV, H.deps);
  const job = (extra = {}) => Object.assign({task: "chat", system: "You help.", content: [{type: "text", text: "What is due?"}], schema: {type: "OBJECT", properties: {ok: {type: "INTEGER"}}, required: ["ok"]}}, extra);
  const J = async res => ({s: res.status, j: await res.json()});

  let H = harness(), x = await J(await call(H, job()));
  eq([x.s, x.j.data], [200, {ok: 1}], "a Pro student gets an answer");
  eq(H.calls[0].model, "claude-haiku-5-5", "on Haiku 5.5");
  eq(H.calls[0].output_config.format.schema.additionalProperties, false, "with the answer shape made strict");
  eq((await H.meterOf().read()).spent, P.costOf({input_tokens: 1000, output_tokens: 200}), "and is charged exactly what it cost");
  ok(H.counts.length === 0, "plain short text needs no token count (its byte length is an upper bound)");

  // Forged settings are ignored
  H = harness();
  await call(H, job({model: "claude-opus-5-5", max_tokens: 128000, maxTokens: 128000, temperature: 0, tools: [{type: "web_search_20260209", name: "web_search"}], thinking: {type: "adaptive"}, output_config: {effort: "max"}, task: "chat"}));
  const c0 = H.calls[0];
  eq([c0.model, c0.max_tokens, c0.output_config.effort, c0.tools, c0.temperature], ["claude-haiku-5-5", 6000, "medium", undefined, undefined], "a forged model, cap, effort, temperature or tool list changes nothing");

  // Who can use it
  H = harness();
  eq((await J(await call(H, job(), {token: "bad"}))).s, 401, "not signed in");
  H.user = {...H.user, anonymous: true}; eq((await J(await call(H, job()))).s, 401, "a guest account");
  H.user = {...H.user, anonymous: false, confirmed: false}; eq((await J(await call(H, job()))).j.error, "unconfirmed", "an unconfirmed email");
  H = harness({tier: "none"}); x = await J(await call(H, job()));
  eq([x.s, x.j.error], [403, "not_pro"], "a free account");
  ok(!H.calls.length, "and nothing reached Anthropic");
  H = harness({tier: null}); eq((await J(await call(H, job()))).s, 503, "if the plan can't be checked, nothing runs");
  for (const t of ["none"]) { H = harness({tier: t}); eq((await J(await call(H, job()))).j.error, "not_pro", "anything but paid Pro is refused"); }
  H = harness(); eq((await J(await call(H, job(), {env: {...ENV, CF_AIG_TOKEN: ""}}))).j.error, "off", "no gateway token: off");
  H = harness(); x = await J(await call(H, null, {path: "/v1/status", method: "GET"}));
  eq([x.s, x.j.on, x.j.tier, x.j.usedPct], [200, true, "paid", 0], "status for a Pro student");
  H = harness({tier: "none"}); x = await J(await call(H, null, {path: "/v1/status", method: "GET"}));
  eq([x.j.on, x.j.error], [false, "not_pro"], "status for a free account");

  // Size limits
  H = harness(); eq((await J(await call(H, job({content: [{type: "text", text: "x".repeat(20000)}]})))).s, 200, "20 KB of text is fine");
  H = harness({count: () => 95000}); x = await J(await call(H, job({content: [{type: "text", text: "x".repeat(200000)}]})));
  eq([x.s, x.j.error], [413, "too_long"], "a prompt over 90K tokens is refused (it would also cost 5 times as much)");
  ok(H.counts.length === 1 && !H.calls.length, "after Anthropic's own count, before any model call");
  H = harness({count: () => 60000}); x = await J(await call(H, job({task: "tutor", content: [{type: "text", text: "y".repeat(200000)}]})));
  eq(x.s, 200, "long text that really is under 90K tokens runs (counted, not guessed)");
  H = harness(); x = await J(await call(H, job({content: [img, {type: "text", text: "what is this"}]})));
  ok(x.s === 200 && H.counts.length === 1, "a file is always counted by Anthropic before the reservation");
  H = harness(); eq((await J(await call(H, job({schema: {type: "OBJECT", description: "d".repeat(30000)}})))).s, 413, "an oversized answer shape is refused");
  H = harness(); eq((await J(await call(H, job({system: "s".repeat(70000)})))).s, 413, "an oversized system prompt is refused");
  H = harness(); eq((await J(await call(H, "{not json"))).s, 400, "garbage is refused");
  H = harness(); eq((await J(await call(H, job(), {headers: {"Content-Length": String(30 * 1048576)}}))).s, 413, "a body over 26 MB is refused from its length");

  // The charge is made before the model runs
  H = harness({reply: req => { const sp = H.lastSpent; return {content: [{type: "text", text: JSON.stringify({sp})}], stop_reason: "end_turn", usage: {input_tokens: 10, output_tokens: 10}}; }});
  const orig = H.deps.claude.create; H.deps.claude.create = async req => { H.lastSpent = (await H.meterOf().read()).spent; return orig(req); };
  x = await J(await call(H, job()));
  ok(x.j.data.sp >= P.worstCost(1, 6000), "while the model runs, the worst case is already charged");
  // A student near their limit can't start a job whose worst case would pass it
  H = harness(); await spendBefore(H.meterOf(), 2499000);
  x = await J(await call(H, job({task: "cards"})));
  eq([x.s, x.j.error], [402, "used_up"], "$2.499 used: a flashcard job (worst case over $0.001) is refused");
  ok(!H.calls.length, "and never reached Anthropic");
  // Failures
  H = harness({reply: () => Object.assign(new Error("overloaded"), {status: 529})});
  x = await J(await call(H, job())); eq([x.s, x.j.error], [503, "busy"], "Anthropic overloaded: busy");
  eq((await H.meterOf().read()).spent, 0, "a request Anthropic refused with a status costs the student nothing");
  H = harness({reply: () => new Error("socket hang up")});
  x = await J(await call(H, job())); eq(x.s, 503, "a dropped connection: busy");
  ok((await H.meterOf().read()).spent > 0, "but it may have been billed, so the reservation is kept");
  H = harness({reply: () => ({content: [], stop_reason: "refusal", usage: {input_tokens: 100, output_tokens: 0}})});
  x = await J(await call(H, job())); eq([x.s, x.j.error], [422, "refused"], "a safety refusal is passed on");
  H = harness({reply: () => ({content: [{type: "text", text: "not json"}], stop_reason: "end_turn", usage: {input_tokens: 100, output_tokens: 50}})});
  x = await J(await call(H, job())); eq([x.s, x.j.error], [502, "ai_failed"], "an answer that isn't JSON fails");
  eq((await H.meterOf().read()).spent, P.costOf({input_tokens: 100, output_tokens: 50}), "and is charged what it cost");
  let tries = 0;
  H = harness({reply: req => { tries++; return req.output_config.format ? Object.assign(new Error("schema"), {status: 400}) : {content: [{type: "text", text: "{\"ok\":2}"}], stop_reason: "end_turn", usage: {input_tokens: 300, output_tokens: 30}}; }});
  x = await J(await call(H, job()));
  eq([x.s, x.j.data, tries], [200, {ok: 2}, 2], "an answer shape the API won't take: retried once with the shape in the instructions");
  ok(/JSON Schema/.test(H.calls[1].system) && !H.calls[1].output_config.format, "the retry has no structured-output setting");
  // No limit shared across students: a thousand students' jobs on one day all run
  { const many = harness(); let okAll = true; for (let i = 0; i < 40; i++) { many.user = {...many.user, id: "0b6f2a1c-1d2e-4f50-8a9b-" + String(i).padStart(12, "0")}; const r = await J(await call(many, job())); if (r.s !== 200) okAll = false; } ok(okAll, "forty students in a row all get answers (each has only their own limits)"); }
  // Soft limit reaches the request
  H = harness(); await spendBefore(H.meterOf(), 2100000);
  await call(H, job({task: "chat"})); await call(H, job({task: "grade"}));
  eq([H.calls[0].output_config.effort, H.calls[1].output_config.effort], ["low", "high"], "past $2: chat thinks less, grading doesn't");
  // Parallel requests through the whole path
  H = harness({reply: () => ({content: [{type: "text", text: "{}"}], stop_reason: "end_turn", usage: {input_tokens: 3000, output_tokens: 6000}})});
  const env2 = {...ENV, DAILY_USD: "0.05", PER_MINUTE: "60", MAX_INFLIGHT: "8"};
  const res = await Promise.all(Array.from({length: 20}, () => call(H, job(), {env: env2}).then(J)));
  ok((await H.meterOf().read()).spent <= 50000, "twenty requests at once never take a student past the daily limit");
  ok(res.filter(r => r.s === 200).length < 20, "some were refused");

  // Delete My Account
  H = harness(); x = await J(await call(H, null, {path: "/v1/me", method: "DELETE"}));
  eq(x.j.ok, true, "deleting");
  eq((await J(await call(H, job()))).j.error, "gone", "then no more AI on that account id");
  H = harness(); eq((await J(await call(H, null, {path: "/v1/me", method: "DELETE", env: {}}))).j.ok, true, "deleting works while Pro AI is off");
  eq((await J(await call(harness(), null, {path: "/v1/me", method: "DELETE", token: "bad"}))).s, 401, "and needs the student's own sign-in");

  /* Transcription */
  const audio = (bytes, type = "audio/webm") => ({path: "/v1/transcribe", headers: {"Content-Type": type}, raw: new Uint8Array(bytes)});
  const tcall = (H, a, env) => P.handle(new Request("https://w.example/v1/transcribe", {method: "POST", headers: {Authorization: "Bearer good", "Content-Type": a.headers["Content-Type"]}, body: a.raw}), env || ENV, H.deps).then(J);
  H = harness(); x = await tcall(H, audio(240000));
  eq([x.s, x.j.text], [200, "hello"], "a 30-second clip");
  eq((await H.meterOf().read()).spent, P.audioCost(30), "charged by its real length");
  H = harness({whisper: () => ({text: "hi"})}); await tcall(H, audio(240000));
  eq((await H.meterOf().read()).spent, P.audioWorst(240000), "no length reported: the worst case stays charged");
  H = harness({whisper: () => ({text: "hi", transcription_info: {duration: 1e9}})}); await tcall(H, audio(240000));
  eq((await H.meterOf().read()).spent, P.audioWorst(240000), "a claimed length can't charge past the reservation");
  H = harness(); eq((await tcall(H, audio(10, "application/json"))).s, 400, "only audio or video");
  H = harness(); eq((await tcall(H, audio(P.MAX_AUDIO_BYTES + 1))).s, 413, "over 20 MB is refused");
  H = harness(); eq((await tcall(H, audio(1000), {...ENV, WHISPER_OFF: "1"})).s, 503, "transcription can be turned off on its own");
  H = harness({tier: "none"}); eq((await tcall(H, audio(1000))).s, 403, "free accounts can't transcribe");


  /* Search by meaning */
  const ecall = (H, body, env) => P.handle(new Request("https://w.example/v1/embed", {method: "POST", headers: {Authorization: "Bearer good", "Content-Type": "application/json"}, body: JSON.stringify(body)}), env || ENV, H.deps).then(J);
  H = harness(); H.deps.embed = async texts => ({data: texts.map(() => [0.1, 0.2, 0.3])});
  x = await ecall(H, {texts: ["photosynthesis", "日本語のノート"]});
  eq([x.s, x.j.vectors.length], [200, 2], "texts become vectors");
  eq((await H.meterOf().read()).spent, P.micro((P.textBytes("photosynthesis") + 8 + P.textBytes("日本語のノート") + 8) * P.EMBED_PER_TOKEN), "charged by bytes, an upper bound on tokens");
  H = harness(); H.deps.embed = async () => ({data: [[1]]});
  for (const [b, m] of [[{texts: []}, "no texts"], [{texts: Array(101).fill("x")}, "over 100 texts"], [{texts: ["x".repeat(8001)]}, "a text over 8,000 characters"], [{texts: [5]}, "a number"], [{texts: ["  "]}, "blank text"], [{}, "no list"]]) eq((await ecall(H, b)).s, 400, `refused: ${m}`);
  H = harness({tier: "none"}); H.deps.embed = async () => ({data: [[1]]}); eq((await ecall(H, {texts: ["a"]})).s, 403, "free accounts can't");
  H = harness(); H.deps.embed = async () => ({data: [[NaN]]}); eq((await ecall(H, {texts: ["a"]})).s, 502, "garbled vectors are refused");
  H = harness(); H.deps.embed = null; eq((await ecall(H, {texts: ["a"]})).s, 503, "off without Workers AI");

  /* Web lookups on Studyboard AI */
  eq(P.costOf({input_tokens: 0, output_tokens: 0, server_tool_use: {web_search_requests: 3}}), 30000, "each web search is charged $0.01");
  const wr = P.buildRequest({system: "Find it.", blocks: [{type: "text", text: "q"}], schema: {type: "object", properties: {}, additionalProperties: false}, task: P.taskOf("ask"), web: {search: true, fetch: true}});
  eq(wr.tools.map(t => [t.name, t.max_uses]), [["web_search", 1], ["web_fetch", 1]], "web tools with the server's own use limits");
  ok(!wr.output_config.format && /JSON Schema/.test(wr.system), "and the answer shape in the instructions instead");
  const maxIn = P.WEB.maxInput + P.FRAME_TOKENS, rounds = P.WEB.searchUses + P.WEB.fetchUses + 1, per = maxIn + P.WEB.searchUses * P.WEB.searchTokens + P.WEB.fetchUses * P.WEB.fetchTokens;
  ok(rounds * per < P.LONG_PROMPT, `a web job's worst case, all rounds together (${rounds * per} tokens), stays under the 100K long-prompt rate`);
  let wOk = true;
  for (let i = 0; i < 500; i++) { const inTok = Math.floor(Math.random() * maxIn), web = {search: Math.random() < 0.5, fetch: true};
    const r = (web.search ? P.WEB.searchUses : 0) + P.WEB.fetchUses + 1, pr = inTok + (web.search ? P.WEB.searchUses * P.WEB.searchTokens : 0) + P.WEB.fetchUses * P.WEB.fetchTokens;
    const real = P.costOf({input_tokens: r * pr, output_tokens: 6000, server_tool_use: {web_search_requests: web.search ? P.WEB.searchUses : 0}});
    if (real > P.webWorst(inTok, 6000, web)) wOk = false; }
  ok(wOk, "a web job's real cost never beats its reservation");
  H = harness(); x = await J(await call(H, job({search: true, urlContext: true})));
  eq([x.s, H.calls[0].tools.length], [200, 2], "a web lookup runs with both tools");
  H = harness(); await call(H, job({search: "yes", urlContext: 1, tools: [{type: "web_search_20250305", name: "web_search", max_uses: 99}]}));
  eq(H.calls[0].tools, undefined, "only a true flag turns web tools on, and a forged tool list is ignored");
  H = harness(); x = await J(await call(H, job({search: true, content: [{type: "text", text: "z".repeat(12000)}]})));
  eq([x.s, x.j.error], [413, "too_long"], "web lookups take at most about 8K tokens of input, so the whole loop stays on the normal rate card");
  H = harness({reply: () => ({content: [{type: "text", text: "{\"ok\":3}"}], stop_reason: "end_turn", usage: {input_tokens: 9000, output_tokens: 400, server_tool_use: {web_search_requests: 2}}})});
  await call(H, job({search: true}));
  eq((await H.meterOf().read()).spent, P.costOf({input_tokens: 9000, output_tokens: 400, server_tool_use: {web_search_requests: 2}}), "charged for its tokens and its searches");

  /* YouTube links (Gemini writes the transcript) */
  eq([P.youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10"), P.youtubeId("https://youtu.be/dQw4w9WgXcQ"), P.youtubeId("https://m.youtube.com/shorts/dQw4w9WgXcQ")], ["dQw4w9WgXcQ", "dQw4w9WgXcQ", "dQw4w9WgXcQ"], "YouTube links, short links and Shorts");
  for (const bad of ["https://evil.example/watch?v=dQw4w9WgXcQ", "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://www.youtube.com/watch?v=short", "https://www.youtube.com/watch?v=dQw4w9WgXcQ/../x", "file:///etc/passwd"]) eq(P.youtubeId(bad), null, `refused: ${bad.slice(0, 40)}`);
  const yr = P.youtubeRequest("dQw4w9WgXcQ");
  eq([yr.contents[0].parts[0].file_data.file_uri, yr.contents[0].parts[0].video_metadata.end_offset, yr.generationConfig.maxOutputTokens], ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "7200s", 32000], "Gemini sees only the canonical link, at most 2 hours, and writes at most 32K tokens");
  ok(P.ytWorst() >= P.ytCost(7200 * 100, 32000), "the reservation covers 2 hours at 100 tokens a second and a full answer");
  const ycall = (H, body, env) => P.handle(new Request("https://w.example/v1/youtube", {method: "POST", headers: {Authorization: "Bearer good", "Content-Type": "application/json"}, body: JSON.stringify(body)}), env || ENV, H.deps).then(J);
  const gOk = (u = {promptTokenCount: 160000, candidatesTokenCount: 20000, thoughtsTokenCount: 500}) => async req => ({status: 200, json: {candidates: [{content: {parts: [{text: JSON.stringify({title: "Cells", transcript: "Today: membranes.", onScreen: "Slide 1"})}]}, finishReason: "STOP"}], usageMetadata: u}});
  H = harness(); H.deps.gemini = gOk(); x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"});
  eq([x.s, x.j.transcript, x.j.title], [200, "Today: membranes.", "Cells"], "a video becomes a transcript");
  eq((await H.meterOf().read()).spent, P.ytCost(160000, 20500), "charged for what Gemini read and wrote, thinking included");
  H = harness(); H.deps.gemini = async () => ({status: 400, json: {error: {message: "private"}}}); x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"});
  eq([x.s, x.j.error, (await H.meterOf().read()).spent], [422, "video", 0], "a private or missing video: refused, and not charged");
  H = harness(); H.deps.gemini = async () => { throw new Error("reset"); }; await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"});
  eq((await H.meterOf().read()).spent, P.ytWorst(), "a dropped connection keeps the worst case charged");
  H = harness(); H.deps.gemini = gOk(); eq((await ycall(H, {url: "https://vimeo.com/123"})).s, 400, "only YouTube links");
  H = harness(); H.deps.gemini = gOk(); eq((await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"}, {...ENV, YOUTUBE_OFF: "1"})).s, 503, "YOUTUBE_OFF turns YouTube links off");
  H = harness(); H.deps.gemini = async () => ({status: 401, json: {}}); x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"});
  eq([x.s, x.j.error, (await H.meterOf().read()).spent], [503, "off", 0], "if the gateway won't serve Gemini, it's off for now and nothing is charged");
  H = harness(); H.deps.gemini = gOk(); x = await J(await call(H, null, {path: "/v1/status", method: "GET", env: ENV}));
  eq(x.j.youtube, true, "status says YouTube links work");
  H = harness({tier: "none"}); H.deps.gemini = gOk(); eq((await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"})).s, 403, "free accounts can't");

  /* Token counts are free to us but limited per student, so they can't be used to flood Anthropic */
  H = harness({count: () => 95000});
  const floods = []; for (let i = 0; i < 25; i++) floods.push((await J(await call(H, job({content: [{type: "text", text: "x".repeat(200000)}]})))).j.error);
  eq([floods.filter(e => e === "too_long").length, floods.filter(e => e === "rate").length], [20, 5], "after 20 counted requests in a minute, the rest are turned away before reaching Anthropic");
  ok(H.counts.length === 20, "so only 20 token counts were made");

  /* If the gateway can't count tokens, files get a generous estimate instead (jobs still run, and are still charged first) */
  const pdf3 = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Pages /Kids [2 0 R 3 0 R 4 0 R] >>\n2 0 obj << /Type /Page >>\n3 0 obj << /Type /Page >>\n4 0 obj << /Type/Page >>\n%%EOF").toString("base64");
  eq(P.pdfPages(pdf3), 3, "pages are counted from the PDF (and /Pages isn't a page)");
  H = harness({count: () => { throw new Error("not supported"); }});
  let seenReserve = 0; const m0 = H.meterOf(), r0 = m0.reserve.bind(m0); m0.reserve = (c, l) => { seenReserve = c; return r0(c, l); };
  x = await J(await call(H, job({task: "tutor", content: [{type: "document", source: {type: "base64", media_type: "application/pdf", data: pdf3}}, {type: "text", text: "summarize"}]})));
  eq(x.s, 200, "a PDF still runs when the count isn't available");
  ok(seenReserve >= P.worstCost(3 * P.PDF_PAGE_TOKENS, P.TASKS.tutor.out), "reserved as if each page were 5,000 tokens");

  /* Nothing but Haiku 5.5 for Claude, and only Whisper and bge-m3 on Workers AI */
  const idx = require("fs").readFileSync(path.join(__dirname, "..", "cloudflare", "ai-pro", "src", "index.js"), "utf8");
  const aiRuns = [...idx.matchAll(/env\.AI\.run\(\s*([A-Za-z_]+)/g)].map(m => m[1]);
  eq(aiRuns.sort(), ["EMBED_MODEL", "WHISPER_MODEL"], "Workers AI is only ever asked for Whisper (audio) and bge-m3 (search by meaning), by name");
  eq([P.WHISPER_MODEL, P.EMBED_MODEL], ["@cf/openai/whisper-large-v3-turbo", "@cf/baai/bge-m3"], "and those names are fixed in code");
  ok(!/model\s*:\s*(?!MODEL\b)["'`]claude/.test(idx) && !/messages\.create\(\s*\{/.test(idx), "the Worker never names another Claude model, or builds a Claude request itself");
  let allHaiku = true;
  for (const name of Object.keys(P.TASKS).concat(["unknown-job", "__proto__"])) for (const soft of [false, true]) for (const web of [null, {search: true, fetch: true}]) {
    const t = P.taskOf(name, soft), r = P.buildRequest({system: "s", blocks: [{type: "text", text: "q"}], schema: {type: "object", properties: {}, additionalProperties: false}, task: t, web});
    if (r.model !== "claude-haiku-5-5" || !["low", "medium", "high"].includes(r.output_config.effort) || (t.effort === "none") !== (r.thinking.type === "disabled")) allHaiku = false;
  }
  ok(allHaiku, "every job, before and past the soft limit, with or without web lookups: Haiku 5.5 at its own effort (thinking off only for the no-thinking jobs)");
  eq(Object.entries(P.TASKS).filter(([, t]) => t.effort === "high").map(([k]) => k).sort(), ["breakdown", "cards", "cases", "grade", "practice", "quiz", "rubric", "syllabus", "tutor"], "the high-thinking jobs");
  eq(Object.entries(P.TASKS).filter(([, t]) => t.effort === "none").map(([k]) => k).sort(), ["annintel", "classify", "describe", "line", "news", "ping", "quickadd", "remote", "tag", "triage"], "the no-thinking jobs");

  /* The owner's usage summary: exact totals from the usage reports, counts only, behind its own secret */
  const OWNER = "owner-secret-0123456789-abcdefghij";
  const oget = (H, tok, env, q = "") => P.handle(new Request("https://w.example/v1/owner/usage" + q, {headers: tok ? {Authorization: "Bearer " + tok} : {}}), env || {...ENV, OWNER_TOKEN: OWNER}, H.deps).then(J);
  H = harness({reply: req => ({content: [{type: "text", text: "{\"ok\":1}"}], stop_reason: "end_turn", usage: req.output_config.effort === "high"
    ? {input_tokens: 2000, cache_read_input_tokens: 5000, cache_creation_input_tokens: 0, output_tokens: 900}
    : {input_tokens: 1000, cache_creation_input_tokens: 3000, output_tokens: 200, server_tool_use: {web_search_requests: 1}}})});
  await call(H, job({task: "grade", content: [{type: "text", text: "SECRET-STUDENT-ANSWER 42"}]}));
  await call(H, job({task: "chat", search: true}));
  await new Promise(r => setTimeout(r, 30));
  x = await oget(H, OWNER);
  const k = x.j.total.kinds.claude, c1 = P.costOf({input_tokens: 2000, cache_read_input_tokens: 5000, output_tokens: 900}), c2 = P.costOf({input_tokens: 1000, cache_creation_input_tokens: 3000, output_tokens: 200, server_tool_use: {web_search_requests: 1}});
  eq([x.s, k.jobs, k.input, k.cacheRead, k.cacheWrite, k.output, k.searches, k.unreported], [200, 2, 3000, 5000, 3000, 1100, 1, 0], "the owner sees every kind of token, and web searches, added up exactly");
  eq(k.cost, (c1 + c2) / 1e6, "and the cost, the same as what the students were charged (in dollars)");
  eq(x.j.total.tasks, undefined, "the total has no per-job split; each day does");
  eq(Object.keys(x.j.days[0].tasks).sort(), ["chat", "grade"], "each day shows cost by job");
  ok(!JSON.stringify([...H.deps.totalsMap.values()].map(t => t.s.m ? [...t.s.m.values()] : [])).includes("SECRET-STUDENT-ANSWER"), "nothing a student sent is stored in the totals");
  eq((await oget(H, "wrong-token-0123456789-abcdefgh")).s, 404, "a wrong owner token gets nothing (not even a hint the page exists)");
  eq((await oget(H, "")).s, 404, "no token, nothing");
  eq((await oget(H, "short", {...ENV, OWNER_TOKEN: "short"})).s, 404, "an owner token under 24 characters doesn't switch it on");
  eq((await oget(H, OWNER, ENV)).s, 404, "off until OWNER_TOKEN is set");
  H = harness({reply: () => ({content: [{type: "text", text: "{}"}], stop_reason: "end_turn"})});
  await call(H, job()); await new Promise(r => setTimeout(r, 30));
  x = await oget(H, OWNER);
  eq(x.j.total.kinds.claude.unreported, 1, "a reply without a usage report is counted as unreported (charged at its worst case)");
  H = harness(); await tcall(H, audio(240000)); await new Promise(r => setTimeout(r, 30));
  x = await oget(H, OWNER);
  eq([x.j.total.kinds.whisper.jobs, x.j.total.kinds.whisper.audioSeconds, x.j.total.kinds.whisper.cost], [1, 30, P.audioCost(30) / 1e6], "transcription: minutes of audio and their cost");


  /* The owner can look up one student: their month so far, in dollars, against their limits */
  H = harness({reply: () => ({content: [{type: "text", text: "{}"}], stop_reason: "end_turn", usage: {input_tokens: 4000, output_tokens: 1000}})}); H.deps.gemini = gOk();
  await call(H, job({task: "grade"})); await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"});
  x = await oget(H, OWNER, null, "?user=" + H.user.id);
  const want1 = P.costOf({input_tokens: 4000, output_tokens: 1000}) + P.ytCost(160000, 20500);
  eq([x.s, x.j.spent, x.j.today, x.j.limit, x.j.dailyLimit, x.j.youtubeVideos, x.j.youtubeMonthly], [200, want1 / 1e6, want1 / 1e6, 2.25, 0.9, 1, 10], "one student's month: exactly what their jobs cost, against $2.50 a month and $1 a day, and their YouTube videos");
  eq(Object.keys(x.j).filter(k => /text|content|message|question/i.test(k)), [], "and nothing about what they asked");
  eq((await oget(H, "", null, "?user=" + H.user.id)).s, 404, "only with the owner token");
  eq((await oget(H, OWNER, null, "?user=not-an-id")).s, 400, "a garbled id is refused");
  /* A monthly cap on YouTube videos per student */
  eq([P.config({...ENV}).ytMonthly, P.config({...ENV, YOUTUBE_MONTHLY: "5"}).ytMonthly, P.config({...ENV, YOUTUBE_MONTHLY: "9999"}).ytMonthly, P.config({...ENV, YOUTUBE_MONTHLY: "0"}).ytMonthly], [10, 5, 100, 0], "10 videos a month by default; settings can't go past 100; 0 turns them off");
  H = harness(); H.deps.gemini = gOk();
  const yenv = {...ENV, YOUTUBE_MONTHLY: "2"};
  x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"}, yenv); eq([x.s, x.j.youtubeLeft], [200, 1], "first video: 1 left");
  H.deps.gemini = async () => ({status: 400, json: {}});
  x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"}, yenv); eq(x.s, 422, "a video that can't be watched...");
  H.deps.gemini = gOk();
  x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"}, yenv); eq([x.s, x.j.youtubeLeft], [200, 0], "...gives its place back: the next one still runs");
  const spentBefore = (await H.meterOf().read()).spent;
  x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"}, yenv); eq([x.s, x.j.error], [402, "video_limit"], "the month's videos used: refused");
  eq((await H.meterOf().read()).spent, spentBefore, "before anything was charged or sent to Gemini");
  x = await J(await call(H, null, {path: "/v1/status", method: "GET", env: yenv})); eq([x.j.youtubeLeft, x.j.youtubeMonthly], [0, 2], "status shows the videos left");
  const racer = harness(); racer.deps.gemini = gOk();
  const rs = await Promise.all(Array.from({length: 6}, () => ycall(racer, {url: "https://youtu.be/dQw4w9WgXcQ"}, {...ENV, YOUTUBE_MONTHLY: "2", MAX_INFLIGHT: "8", DAILY_USD: "3"})));
  eq(rs.filter(r => r.s === 200).length, 2, "six at once: exactly two run");
  now = Date.UTC(2027, 1, 1, 0, 0, 5);
  x = await ycall(H, {url: "https://youtu.be/dQw4w9WgXcQ"}, yenv); eq(x.s, 200, "a new month brings new videos");

  /* Automatic jobs on Studyboard AI think at least at medium */
  now = Date.UTC(2027, 1, 15, 12);
  eq([P.config(ENV).autoEffort, P.config({...ENV, AUTO_EFFORT: "medium"}).autoEffort, P.config({...ENV, AUTO_EFFORT: "max"}).autoEffort], ["", "medium", ""], "each job's own level by default; AUTO_EFFORT can raise them; unknown values are ignored");
  H = harness();
  await call(H, job({task: "remote", auto: true})); await call(H, job({task: "line", auto: true}));
  eq(H.calls.map(c => [c.output_config.effort, c.thinking.type]), [["low", "disabled"], ["low", "disabled"]], "by default an automatic yes/no job and a companion line don't think");
  const AE = {...ENV, AUTO_EFFORT: "medium"}; H = harness();
  await call(H, job({task: "remote", auto: true}), {env: AE}); await call(H, job({task: "remote"}), {env: AE}); await call(H, job({task: "line", auto: true}), {env: AE}); await call(H, job({task: "practice", auto: true}), {env: AE});
  eq(H.calls.map(c => [c.output_config.effort, c.thinking.type, c.max_tokens]), [["medium", "adaptive", 4000], ["low", "disabled", 800], ["medium", "adaptive", 4000], ["high", "adaptive", 24000]], "an automatic yes/no job or companion line thinks at medium (with room for it); the same job tapped by hand doesn't; a job already above medium keeps its level");
  H = harness(); await spendBefore(H.meterOf(), 2100000); await call(H, job({task: "remote", auto: true}), {env: AE}); await call(H, job({task: "plan", auto: true}), {env: AE});
  eq(H.calls.map(c => c.output_config.effort), ["low", "low"], "past the soft limit automatic jobs drop back (a yes/no job to no thinking, the plan to low)");
  H = harness(); await call(H, job({task: "plan", auto: true}));
  eq(H.calls[0].output_config.effort, "medium", "the automatic plan thinks at medium either way (its own level)");
  // Jobs left behind by a page that closed or reloaded don't block new ones (Studyboard AI Mode keeps its meter on the device)
  { const store = mem(), L = P.limits(ENV);
    const old = new P.Meter(store, () => now, null, {sid: "gone", alive: sid => sid === "gone"});
    for (let i = 0; i < L.inflight; i++) ok((await old.reserve(1000, L)).ok, "a job starts on the old page " + (i + 1));
    eq((await old.reserve(1000, L)).reason, "rate", "a full set of jobs in flight blocks the next one on that page");
    const fresh = new P.Meter(store, () => now + 1000, null, {sid: "new", alive: sid => sid === "new"});
    const r = await fresh.reserve(1000, L);
    ok(r.ok, "after a reload, the old page's unfinished jobs no longer count as in flight");
    eq((await fresh.read()).spent, 1000 * (L.inflight + 1), "but what they reserved stays charged");
    const legacy = mem(); await legacy.put("flying", [{id: "x1", at: now, cost: 5}, {id: "x2", at: now, cost: 5}, {id: "x3", at: now, cost: 5}, {id: "x4", at: now, cost: 5}]);
    ok((await new P.Meter(legacy, () => now, null, {sid: "me", alive: sid => sid === "me"}).reserve(1000, L)).ok, "and jobs saved before pages were tracked don't block either");
    const w = mem(); await w.put("flying", [{id: "x1", at: now, cost: 5}, {id: "x2", at: now, cost: 5}, {id: "x3", at: now, cost: 5}, {id: "x4", at: now, cost: 5}]);
    ok(!(await new P.Meter(w, () => now).reserve(1000, L)).ok, "the Worker (no pages) still counts every job in flight"); }
  // Background jobs leave room for what the student asks for
  { H = harness(); const L = P.limits(ENV), m = H.meterOf();
    for (let i = 0; i < L.inflight - 1; i++) await m.reserve(1000, L);
    x = await J(await call(H, job({auto: true})));
    eq(x.s, 429, "a background job can't take the last job slot");
    x = await J(await call(H, job()));
    eq(x.s, 200, "but the student's own request still runs");
    H = harness(); for (let i = 0; i < L.perMinute - 5; i++) await H.meterOf().touch(L);
    eq((await J(await call(H, job({auto: true})))).s, 429, "background jobs stop 5 requests short of the per-minute limit");
    eq((await J(await call(H, job()))).s, 200, "leaving those for the student"); }
  console.log(`ai-pro: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
