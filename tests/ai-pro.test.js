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
  const ENV = {ANTHROPIC_API_KEY: "sk-test", SUPABASE_URL: "https://x.supabase.co", SUPABASE_KEY: "pk"};

  /* Settings can't be raised past the hard ranges */
  eq(P.config({}).on, false, "off without an API key");
  eq(P.config(ENV).on, true, "on with a key");
  eq(P.config({...ENV, PRO_AI_OFF: "1"}).on, false, "PRO_AI_OFF turns it off with the key still set");
  const wild = P.config({...ENV, MONTHLY_HARD_USD: "500", MONTHLY_SOFT_USD: "900", DAILY_USD: "99", TRIAL_TOTAL_USD: "50", GLOBAL_DAILY_USD: "1e9", PER_MINUTE: "5000", MAX_INFLIGHT: "999", GIFT_MONTHLY_HARD_USD: "77"});
  ok(wild.hardUsd <= P.HARD.monthUsd && wild.softUsd <= wild.hardUsd && wild.dayUsd <= P.HARD.dayUsd && wild.trialUsd <= P.HARD.trialUsd, "a mistyped setting can't lift the per-student limits past their hard ranges");
  ok(wild.globalDayUsd <= P.HARD.globalDayUsd && wild.perMinute <= P.HARD.perMinute && wild.inflight <= P.HARD.inflight && wild.giftHardUsd <= wild.hardUsd, "nor the shared ceiling, the rate or the gift limit");
  eq([P.config({...ENV, MONTHLY_HARD_USD: "abc"}).hardUsd, P.config({...ENV, MONTHLY_HARD_USD: "-3"}).hardUsd], [4, 0], "a bad value falls back to the default; a negative one means no AI");
  eq([P.config(ENV).softUsd, P.config(ENV).hardUsd, P.config(ENV).trialUsd, P.config(ENV).dayUsd, P.config(ENV).globalDayUsd], [3, 4, 0.3, 1, 25], "defaults: $3 soft, $4 hard a month, $0.30 for the free week, $1 a day, $25 a day for everyone");

  /* Plans: only the server's own row decides */
  const now0 = Date.UTC(2026, 10, 4, 12), later = new Date(now0 + 86400000).toISOString(), past = new Date(now0 - 86400000).toISOString();
  eq(P.tierOf({plan: "pro", pro_until: later}, now0), "paid", "paid Pro");
  eq(P.tierOf({plan: "pro", pro_until: null}, now0), "paid", "Pro with no end date");
  eq(P.tierOf({plan: "lifetime"}, now0), "paid", "lifetime");
  eq(P.tierOf({plan: "pro", pro_until: past}, now0), "none", "lapsed Pro gets nothing");
  eq(P.tierOf({plan: "free", promo_until: later}, now0), "gift", "a promo code");
  eq(P.tierOf({plan: "free", grant_lifetime: true}, now0), "gift", "a lifetime grant");
  eq(P.tierOf({plan: "free", trial_until: later}, now0), "trial", "the free week");
  eq(P.tierOf({plan: "free", trial_until: past}, now0), "none", "an ended free week");
  eq([P.tierOf(null), P.tierOf(undefined), P.tierOf({plan: "free"}), P.tierOf({plan: "pro", pro_until: "not a date"}, now0)], ["none", "none", "none", "none"], "no row, a free row, or a garbled date: nothing");

  /* The server picks the thinking level and the output cap */
  eq(P.taskOf("grade").effort, "high", "grading thinks hard");
  eq(P.taskOf("tutor").effort, "high", "Ask About Course and Teach It Back think hard");
  eq(P.taskOf("chat").effort, "medium", "chat thinks at medium");
  eq(P.taskOf("plan").effort, "low", "the automatic plan thinks a little");
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
  const lim = P.limitsFor("paid", P.config(ENV)), st = new P.Meter(mem(), () => now);
  eq([lim.monthMicro, lim.softMicro, lim.dayMicro, lim.trialMicro], [4e6, 3e6, 1e6, null], "paid limits in micro-dollars");
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
  for (let d = 0; d < 4; d++) { const x = await st2.reserve(990000, lim); ok(x.ok, `day ${d + 1}`); await st2.settle(x.id, 990000); now += 86400000; }
  const soft = await st2.status(lim); ok(soft.soft && soft.usedPct === 99, "past $3 the student is told routine jobs think less");
  eq((await st2.reserve(100000, lim)).reason, "used_up", "$4 a month: refused until next month");
  now = Date.UTC(2026, 11, 1, 0, 0, 1);
  ok((await st2.reserve(100000, lim)).ok, "a new month starts a new allowance");
  // The free week: once, and a new month doesn't reset it
  const tl = P.limitsFor("trial", P.config(ENV)), st3 = new P.Meter(mem(), () => now);
  eq(tl.trialMicro, 300000, "$0.30 for the free week");
  const t1 = await st3.reserve(290000, tl); ok(t1.ok, "trial job"); await st3.settle(t1.id, 290000);
  eq((await st3.reserve(20000, tl)).reason, "used_up", "the free week's AI runs out");
  now = Date.UTC(2027, 0, 1, 0, 0, 1);
  eq((await st3.reserve(20000, tl)).reason, "used_up", "and a new month doesn't refill it");
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
  const del = new P.Meter(mem(), () => now); await del.reserve(3900000, {...lim, dayMicro: 4e6});
  await del.forget();
  eq((await del.reserve(1, lim)).reason, "gone", "a deleted account's id can't be used to get a fresh allowance");
  // The shared ceiling
  const ce = new P.Ceiling(mem());
  const cr = await Promise.all(Array.from({length: 30}, () => ce.reserve(1000000, 25e6)));
  eq(cr.filter(Boolean).length, 25, "everyone together: $25 a day, exactly");
  await ce.settle(1000000, 0);
  ok(await ce.reserve(1000000, 25e6), "a cheaper real cost frees room");

  /* The whole request path, with a fake Anthropic */
  now = Date.UTC(2027, 0, 15, 12);
  // Spending from earlier days this month (so the daily limit doesn't get in the way)
  const spendBefore = async (m, amount) => { const save = now; now -= 2 * 86400000; const r = await m.reserve(amount, {...lim, dayMicro: 9e6}); await m.settle(r.id, amount); now = save; };
  function harness(over = {}){
    const meters = new Map(), ceilings = new Map(), calls = [], counts = [];
    const H = {calls, counts, deferred: [],
      tier: "paid", user: {id: "0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", confirmed: true, anonymous: false},
      reply: req => ({content: [{type: "thinking", thinking: ""}, {type: "text", text: JSON.stringify({ok: 1})}], stop_reason: "end_turn", usage: {input_tokens: 1000, output_tokens: 200}}),
      count: () => 5000, now: () => now};
    Object.assign(H, over);
    H.deps = {
      user: async t => t === "good" ? H.user : null,
      plan: async () => H.tier,
      meter: id => { if (!meters.has(id)) meters.set(id, new P.Meter(mem(), H.now)); return meters.get(id); },
      ceiling: d => { if (!ceilings.has(d)) ceilings.set(d, new P.Ceiling(mem())); return ceilings.get(d); },
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
  H = harness({tier: "trial"}); eq((await J(await call(H, job(), {env: {...ENV, TRIAL_TOTAL_USD: "0"}}))).j.error, "not_pro", "the free week can be given no AI at all");
  H = harness(); eq((await J(await call(H, job(), {env: {...ENV, ANTHROPIC_API_KEY: ""}}))).j.error, "off", "no key: off");
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
  H = harness(); await spendBefore(H.meterOf(), 3999000);
  x = await J(await call(H, job({task: "cards"})));
  eq([x.s, x.j.error], [402, "used_up"], "$3.999 used: a flashcard job (worst case over $0.001) is refused");
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
  // The shared ceiling
  H = harness(); const day = P.dayOf(now), ce2 = H.deps.ceiling(day); await ce2.reserve(25e6 - 10, 25e6);
  x = await J(await call(H, job())); eq([x.s, x.j.error], [503, "busy"], "the shared daily ceiling reached: busy");
  eq((await H.meterOf().read()).spent, 0, "and the student isn't charged");
  // Soft limit reaches the request
  H = harness(); await spendBefore(H.meterOf(), 3100000);
  await call(H, job({task: "chat"})); await call(H, job({task: "grade"}));
  eq([H.calls[0].output_config.effort, H.calls[1].output_config.effort], ["low", "high"], "past $3: chat thinks less, grading doesn't");
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

  console.log(`ai-pro: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
