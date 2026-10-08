// Unit tests for Studyboard's free AI trial Worker (cloudflare/ai-trial/src/trial.js), with an in-memory stand-in for Durable Object
// storage, Supabase and Workers AI. The money rules come first: the daily neuron ceiling can't be raised past HARD_CEILING, only free-plan
// models are used, the worst case is reserved before the model runs, and nothing runs once the day's pool is spent.
// Run: node tests/ai-trial.test.js
const path = require("path"), assert = require("assert"), {pathToFileURL} = require("url");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

(async () => {
  const T = await import(pathToFileURL(path.join(__dirname, "..", "cloudflare", "ai-trial", "src", "trial.js")).href);
  const mem = () => { const m = new Map(); let alarm = null; return {m,
    get: async k => m.get(k), put: async (k, v) => { if (typeof k === "object") Object.entries(k).forEach(([x, y]) => m.set(x, y)); else m.set(k, v); },
    delete: async k => m.delete(k), deleteAll: async () => m.clear(), getAlarm: async () => alarm, setAlarm: async t => { alarm = t; }, deleteAlarm: async () => { alarm = null; }}; };

  // ---- never billed: limits that no setting can lift
  eq(T.HARD_CEILING, 9000, "hard ceiling sits under the free 10,000 neurons a day");
  eq(T.config({DAILY_NEURONS: "50000"}).dailyNeurons, 9000, "DAILY_NEURONS can't go past the hard ceiling");
  eq(T.config({DAILY_NEURONS: "abc"}).dailyNeurons, 8000, "a bad value falls back to 8,000");
  eq(T.config({}).dailyNeurons, 8000, "default 8,000");
  eq(T.config({MODEL: "@cf/moonshotai/kimi-k2.6"}).model, T.DEFAULT_MODEL, "a model that needs paid billing is never used");
  eq(T.config({MODEL: "@cf/zai-org/glm-5.3"}).model, T.DEFAULT_MODEL, "nor any model outside the free list");
  ok(Object.keys(T.MODELS).every(k => !/kimi-k2\.[67]|glm-5|deepseek-v4/.test(k)), "the free list has none of the paid-billing models");
  eq(T.config({MAX_OUTPUT_TOKENS: "999999", MAX_CHARS: "999999"}).maxOut, 4000, "output cap can't be raised past 4,000 tokens");
  eq(T.config({MAX_CHARS: "999999"}).maxChars, 40000, "input cap can't be raised past 40,000 characters");
  // the worst single request at the highest caps still fits many times inside the margin to 10,000
  const worst = Math.max(...Object.values(T.MODELS).map(r => T.neurons(r, T.estTokens(40000 + 9000), 4000)));
  ok(worst < 1000, `worst single request at the highest caps reserves ${worst} neurons (under the 1,000 margin)`);
  ok(T.estTokens(4000) >= 4000 / 2, "token estimate is deliberately high (2 characters a token)");

  // ---- per-student tries
  let now = Date.UTC(2026, 9, 8, 12);
  const cfg = T.config({TRIAL_USES: "3", DAILY_USES: "2"});
  const st = new T.Student(mem(), () => now);
  eq(await st.status(cfg), {left: 3, total: 3, todayLeft: 2, daily: 2}, "new student");
  ok((await st.take(cfg)).ok && (await st.take(cfg)).ok, "two tries today");
  eq((await st.take(cfg)).reason, "today", "third try today is refused");
  eq(await st.status(cfg), {left: 1, total: 3, todayLeft: 0, daily: 2}, "one left, none today");
  now += 86400000;
  eq((await st.status(cfg)).todayLeft, 1, "next day: the last one is available");
  const t3 = await st.take(cfg); ok(t3.ok, "third try");
  eq((await st.take(cfg)).reason, "used_up", "then used up for good");
  await st.refund(t3.day);
  eq((await st.status(cfg)).left, 1, "a failed try is given back");

  // ---- the day pool
  const pool = new T.Pool(mem());
  ok(await pool.reserve(5000, 8000), "reserve under the ceiling");
  ok(!(await pool.reserve(3001, 8000)), "a reservation that would pass the ceiling is refused");
  ok(await pool.reserve(3000, 8000), "exactly up to the ceiling is fine");
  await pool.settle(3000, 1200);
  eq(await pool.spent(), 6200, "settling replaces the reservation with what was used");
  ok(!(await pool.reserve(1801, 8000)) && await pool.reserve(1800, 8000), "the freed neurons can be used again, never more");

  // ---- Supabase sign-in check
  let calls = 0;
  const fakeFetch = async (url, o) => { calls++; const tok = o.headers.Authorization.slice(7);
    if (tok === "good") return new Response(JSON.stringify({id: "u1", email_confirmed_at: "2026-10-01"}));
    if (tok === "new") return new Response(JSON.stringify({id: "u2", email_confirmed_at: null}));
    if (tok === "anon") return new Response(JSON.stringify({id: "u3", is_anonymous: true}));
    return new Response("{}", {status: 401}); };
  const env0 = {SUPABASE_URL: "https://x.supabase.co/", SUPABASE_KEY: "sb_publishable_x"};
  T._forgetUsers();
  eq(await T.verifyUser("good", env0, fakeFetch), {id: "u1", confirmed: true, anonymous: false}, "a signed-in, confirmed student");
  await T.verifyUser("good", env0, fakeFetch);
  eq(calls, 1, "the answer is kept for a few minutes");
  eq(await T.verifyUser("bad", env0, fakeFetch), null, "a refused token");
  eq(await T.verifyUser("good", {}, fakeFetch), null, "no Supabase settings, nobody gets in");

  // ---- answers
  eq(T.readAnswer({choices: [{message: {content: '```json\n{"a":1}\n```'}}]}), {a: 1}, "fenced JSON");
  eq(T.readAnswer({response: {a: 2}}), {a: 2}, "object answer");
  eq(T.readAnswer({choices: [{message: {content: 'Sure! {"a":3} done'}}]}), {a: 3}, "JSON inside text");
  eq(T.readAnswer({choices: [{message: {content: "no json"}}]}), null, "no JSON");
  const msgs = T.messagesFor("Be helpful.", "hi", {type: "object", properties: {a: {type: "string"}}});
  ok(/JSON Schema/.test(msgs[0].content) && msgs[1].content === "hi", "schema goes into the instructions");

  // ---- the whole request
  T._forgetUsers();
  const students = new Map(), pools = new Map(), runs = [];
  let aiReply = {choices: [{message: {content: '{"ok": true}'}, finish_reason: "stop"}], usage: {prompt_tokens: 400, completion_tokens: 50}};
  const env = Object.assign({}, env0, {TRIAL_USES: "4", DAILY_USES: "3", DAILY_NEURONS: "8000"});
  const deps = {
    user: tok => T.verifyUser(tok, env, fakeFetch), now: () => now,
    student: id => { if (!students.has(id)) students.set(id, new T.Student(mem(), () => now)); return students.get(id); },
    pool: day => { if (!pools.has(day)) pools.set(day, new T.Pool(mem())); return pools.get(day); },
    ai: {run: async (model, input) => { runs.push({model, input}); if (aiReply instanceof Error) throw aiReply; return aiReply; }}
  };
  const call = (method, p, body, tok = "good", e = env) => T.handle(new Request("https://trial.example" + p, {method, headers: {"Content-Type": "application/json", Authorization: "Bearer " + tok}, body: body == null ? undefined : typeof body === "string" ? body : JSON.stringify(body)}), e, deps);
  const ask = (text, extra, tok, e) => call("POST", "/v1/ai", Object.assign({task: "explain", system: "Explain.", text}, extra || {}), tok, e);

  eq((await call("GET", "/v1/trial", null, "nobody")).status, 401, "not signed in");
  eq((await call("GET", "/v1/trial", null, "anon")).status, 401, "anonymous sessions don't get the trial");
  eq((await call("GET", "/v1/trial", null, "new")).status, 403, "email not confirmed yet");
  eq(await (await call("GET", "/v1/trial")).json(), {left: 4, total: 4, todayLeft: 3, daily: 3}, "trial status");
  let r = await ask("What is ATP?");
  let j = await r.json();
  eq([r.status, j.data, j.left, j.todayLeft], [200, {ok: true}, 3, 2], "a try answers and counts");
  eq(runs[0].model, T.DEFAULT_MODEL, "on the default free model");
  ok(runs[0].input.max_completion_tokens <= 1500 && runs[0].input.response_format.type === "json_object", "output capped, JSON mode");
  const dayPool = pools.get(T.dayOf(now));
  eq(await dayPool.spent(), T.neurons(T.MODELS[T.DEFAULT_MODEL], 400, 50), "the pool counts what the model reported using");
  // the model failing gives the try back but keeps the neurons counted
  aiReply = new Error("model down");
  const before = await dayPool.spent();
  r = await ask("Again?"); j = await r.json();
  eq([r.status, j.error, j.left], [502, "ai_failed", 3], "a failed answer isn't counted against the student");
  ok(await dayPool.spent() > before, "but its reservation stays counted (never under-count)");
  // no usage reported: the whole reservation stays counted
  aiReply = {choices: [{message: {content: '{"ok": 1}'}}]};
  const b2 = await dayPool.spent(); await ask("Short one");
  ok(await dayPool.spent() - b2 >= T.neurons(T.MODELS[T.DEFAULT_MODEL], T.estTokens(10), 50), "missing usage keeps the reservation");
  aiReply = {choices: [{message: {content: '{"ok": true}'}}], usage: {prompt_tokens: 100, completion_tokens: 10}};
  await ask("Third");
  r = await ask("Fourth today"); j = await r.json();
  eq([r.status, j.error], [429, "today"], "daily limit");
  now += 86400000;
  r = await ask("Next day"); ok(r.status === 200, "next day works");
  r = await ask("Used up?"); j = await r.json();
  eq([r.status, j.error, j.left], [429, "used_up", 0], "used up after the total");
  // too long, bad input
  T._forgetUsers();
  const fresh = Object.assign({}, env);
  eq((await ask("x".repeat(20000), null, "good", fresh)).status, 413, "too long for the trial");
  eq((await call("POST", "/v1/ai", "not json")).status, 400, "not JSON");
  eq((await ask("   ")).status, 400, "nothing to answer");
  // the pool running dry stops everyone, before the model runs
  students.clear(); pools.clear(); runs.length = 0;
  const tight = Object.assign({}, env, {DAILY_NEURONS: "100", TRIAL_USES: "50", DAILY_USES: "50"});
  aiReply = {choices: [{message: {content: '{"ok": true}'}}], usage: {prompt_tokens: 1500, completion_tokens: 400}};   // about 25 neurons a try
  let served = 0, busy = 0;
  for (let i = 0; i < 20; i++) { const x = await ask("y".repeat(3000), null, "good", tight); if (x.status === 200) served++; else if ((await x.json()).error === "busy") busy++; }
  ok(busy > 0 && served < 20, `a spent pool answers busy (${served} served, ${busy} busy)`);
  eq(runs.length, served, "the model never ran for a busy answer");
  ok(await pools.get(T.dayOf(now)).spent() <= 100, "and the day never went past its ceiling");
  eq((await students.get("u1").status(T.config(tight))).left, 50 - served, "busy answers don't use the student's tries");
  // off switch
  r = await ask("hi", null, "good", Object.assign({}, env, {TRIAL_OFF: "1"}));
  eq([r.status, (await r.json()).error], [429, "busy"], "TRIAL_OFF stops every try");
  eq((await call("OPTIONS", "/v1/ai")).headers.get("Access-Control-Allow-Headers"), "Authorization, Content-Type", "CORS preflight");
  console.log(`ai-trial: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
