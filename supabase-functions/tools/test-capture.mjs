// Offline checks for the capture-task Edge Function (no network, no Supabase). Run from the repo root:
//   node --experimental-strip-types supabase-functions/tools/test-capture.mjs
// It loads the real function file with a fake database that follows the same rules as capture_add() in supabase-capture.sql.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cap = await import(pathToFileURL(path.resolve(root, "supabase-functions/capture-task/index.ts")).href);
let passed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log("ok   " + name); } catch (e) { console.error("FAIL " + name + "\n" + (e.stack || e)); process.exitCode = 1; } };

const GOOD = "sbc_" + "A".repeat(43), REVOKED = "sbc_" + "B".repeat(43), GETTOK = "sbc_" + "C".repeat(43);
const hash = (t) => createHash("sha256").update(t).digest("hex");

function setup(opts = {}) {
  const logs = [], rpcCalls = [], inbox = [];
  const tokens = new Map([[hash(GOOD), { revoked: false, allow_get: false }], [hash(REVOKED), { revoked: true, allow_get: false }], [hash(GETTOK), { revoked: false, allow_get: true }]]);
  const f = async (url, init = {}) => {
    assert.ok(String(url).endsWith("/rest/v1/rpc/capture_add"), "only capture_add is called");
    assert.equal(init.headers.Authorization, "Bearer svc-key");
    const b = JSON.parse(init.body); rpcCalls.push(b);
    if (opts.dbDown) return new Response("boom", { status: 500 });
    const tk = tokens.get(b.p_token_hash);
    if (!tk || tk.revoked) return Response.json({ ok: false, error: "invalid_token" });
    if (b.p_via === "get" && !tk.allow_get) return Response.json({ ok: false, error: "get_disabled" });
    if (b.p_idem) { const d = inbox.find(i => i.idem === b.p_idem); if (d) return Response.json({ ok: true, id: d.id, dup: true }); }
    if (opts.limited) return Response.json({ ok: false, error: "rate_limited", retry_after: 600, limit_hour: 30, remaining_hour: 0 });
    if (opts.full) return Response.json({ ok: false, error: "inbox_full", retry_after: 3600 });
    const row = { id: "id" + (inbox.length + 1), idem: b.p_idem, ...b }; inbox.push(row);
    return Response.json({ ok: true, id: row.id, dup: false, limit_hour: 30, remaining_hour: 29 });
  };
  const env = (k) => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc-key" }[k] ?? "");
  return { deps: { env, fetch: f, now: () => 1_800_000_000_000, log: (...a) => logs.push(a.join(" ")) }, logs, rpcCalls, inbox };
}
const post = (body, headers = {}, ct = "application/json") => new Request("https://x/functions/v1/capture-task", { method: "POST", headers: { "content-type": ct, authorization: "Bearer " + GOOD, ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

await test("valid token adds a task and answers with speech", async () => {
  const { deps, inbox, rpcCalls } = setup();
  const res = await cap.handle(post({ text: "Read chapter 4", course: "Bio 101", source: "siri" }), deps);
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.ok, true); assert.equal(j.message, "Added to your Studyboard inbox"); assert.match(j.speech, /^Added to Studyboard: Read chapter 4$/);
  assert.equal(inbox.length, 1); assert.equal(rpcCalls[0].p_token_hash, hash(GOOD)); assert.equal(rpcCalls[0].p_course_hint, "Bio 101");
  assert.equal(rpcCalls[0].p_via, "post");
  assert.equal(res.headers.get("x-ratelimit-remaining"), "29"); assert.equal(res.headers.get("x-ratelimit-limit"), "30");
  assert.ok(!JSON.stringify(rpcCalls).includes(GOOD), "the plain token is never sent on to the database");
});
await test("token via X-Studyboard-Token works", async () => {
  const { deps } = setup();
  const res = await cap.handle(post({ text: "x" }, { authorization: "", "x-studyboard-token": GOOD }), deps);
  assert.equal(res.status, 200);
});
await test("missing, malformed, unknown and revoked tokens get the same 401", async () => {
  const bodies = [];
  for (const auth of ["", "Bearer nope", "Bearer sbc_" + "Z".repeat(43), "Bearer " + REVOKED]) {
    const { deps, inbox } = setup();
    const res = await cap.handle(post({ text: "x" }, { authorization: auth }), deps);
    assert.equal(res.status, 401); bodies.push(await res.text()); assert.equal(inbox.length, 0);
  }
  assert.equal(new Set(bodies).size, 1, "no token oracle");
});
await test("malformed token never reaches the database", async () => {
  const { deps, rpcCalls } = setup();
  await cap.handle(post({ text: "x" }, { authorization: "Bearer short" }), deps);
  assert.equal(rpcCalls.length, 0);
});
await test("rate limit becomes 429 with Retry-After", async () => {
  const { deps } = setup({ limited: true });
  const res = await cap.handle(post({ text: "x" }), deps);
  assert.equal(res.status, 429); assert.equal(res.headers.get("retry-after"), "600"); assert.equal((await res.json()).ok, false);
});
await test("full inbox becomes 429", async () => {
  const { deps } = setup({ full: true });
  const res = await cap.handle(post({ text: "x" }), deps);
  assert.equal(res.status, 429); assert.equal(res.headers.get("retry-after"), "3600");
});
await test("oversize body (content-length and streamed) is 413", async () => {
  const { deps, rpcCalls } = setup();
  const big = JSON.stringify({ text: "a".repeat(5000) });
  let res = await cap.handle(post(big, { "content-length": String(big.length) }), deps);
  assert.equal(res.status, 413);
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(big.slice(0, 3000))); c.enqueue(new TextEncoder().encode(big.slice(3000))); c.close(); } });
  res = await cap.handle(new Request("https://x/f", { method: "POST", headers: { authorization: "Bearer " + GOOD, "content-type": "application/json" }, body: stream, duplex: "half" }), deps);
  assert.equal(res.status, 413); assert.equal(rpcCalls.length, 0);
});
await test("text over 500 chars, empty text and bad JSON are 400", async () => {
  const { deps, rpcCalls } = setup();
  assert.equal((await cap.handle(post({ text: "a".repeat(501) }), deps)).status, 400);
  assert.equal((await cap.handle(post({ text: "   " }), deps)).status, 400);
  assert.equal((await cap.handle(post({}), deps)).status, 400);
  assert.equal((await cap.handle(post("{nope"), deps)).status, 400);
  assert.equal((await cap.handle(post("[1,2]"), deps)).status, 400);
  assert.equal((await cap.handle(post({ text: { a: 1 } }), deps)).status, 400);
  assert.equal(rpcCalls.length, 0);
});
await test("form-encoded body works (Shortcuts 'Form' and Tasker)", async () => {
  const { deps, inbox } = setup();
  const res = await cap.handle(post("text=Buy+lab+goggles&due=friday+5pm&course=Chem&source=bixby", {}, "application/x-www-form-urlencoded"), deps);
  assert.equal(res.status, 200);
  assert.equal(inbox[0].p_text, "Buy lab goggles"); assert.equal(inbox[0].p_due_text, "friday 5pm"); assert.equal(inbox[0].p_due_date, null);
  assert.equal(inbox[0].p_source, "bixby");
});
await test("natural-language due is stored raw; ISO dates become real fields", async () => {
  const { deps, inbox } = setup();
  await cap.handle(post({ text: "a", due: "next tuesday after class" }), deps);
  await cap.handle(post({ text: "b", due: "2026-10-09" }), deps);
  await cap.handle(post({ text: "c", due: "2026-10-09T17:30:00Z" }), deps);
  await cap.handle(post({ text: "d", due: "2026-02-31" }), deps);
  await cap.handle(post({ text: "e", due: "2026-10-09", due_time: "9:05" }), deps);
  assert.deepEqual([inbox[0].p_due_date, inbox[0].p_due_text], [null, "next tuesday after class"]);
  assert.deepEqual([inbox[1].p_due_date, inbox[1].p_due_time, inbox[1].p_due_text], ["2026-10-09", null, null]);
  assert.deepEqual([inbox[2].p_due_date, inbox[2].p_due_time], ["2026-10-09", "17:30"]);
  assert.deepEqual([inbox[3].p_due_date, inbox[3].p_due_text], [null, "2026-02-31"]);
  assert.deepEqual([inbox[4].p_due_date, inbox[4].p_due_time], ["2026-10-09", "09:05"]);
});
await test("idempotency key (header or id field) dedupes retries", async () => {
  const { deps, inbox } = setup();
  const a = await (await cap.handle(post({ text: "once" }, { "idempotency-key": "k1" }), deps)).json();
  const b = await (await cap.handle(post({ text: "once", id: "k1" }), deps)).json();
  assert.equal(a.duplicate, false); assert.equal(b.duplicate, true); assert.equal(b.ok, true); assert.equal(inbox.length, 1);
});
await test("GET capture is off by default (same 401), on only for flagged tokens", async () => {
  const { deps, inbox } = setup();
  let res = await cap.handle(new Request(`https://x/f?token=${GOOD}&text=hi`), deps);
  assert.equal(res.status, 401); assert.equal(inbox.length, 0);
  res = await cap.handle(new Request(`https://x/f?token=${REVOKED}&text=hi`), deps);
  assert.equal(res.status, 401);
  res = await cap.handle(new Request(`https://x/f?token=${GETTOK}&text=hi%20there&due=2026-10-09`), deps);
  assert.equal(res.status, 200); assert.equal(inbox[0].p_via, "get"); assert.equal(inbox[0].p_text, "hi there"); assert.equal(inbox[0].p_due_date, "2026-10-09");
  assert.ok(!JSON.stringify(inbox[0]).includes(GETTOK));
});
await test("the query string and token are never logged", async () => {
  const { deps, logs } = setup();
  await cap.handle(new Request(`https://x/f?token=${GETTOK}&text=secret%20homework`), deps);
  await cap.handle(post({ text: "secret homework" }), deps);
  await cap.handle(post({ text: "x" }, { authorization: "Bearer " + REVOKED }), deps);
  const all = logs.join("\n");
  assert.ok(logs.length >= 3); assert.ok(!all.includes(GETTOK) && !all.includes(GOOD) && !all.includes("secret") && !all.includes("token="), all);
  for (const l of logs) JSON.parse(l);
});
await test("CORS preflight and headers", async () => {
  const { deps } = setup();
  let res = await cap.handle(new Request("https://x/f", { method: "OPTIONS" }), deps);
  assert.equal(res.status, 204); assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.match(res.headers.get("access-control-allow-headers"), /authorization/); assert.match(res.headers.get("access-control-allow-headers"), /idempotency-key/);
  res = await cap.handle(post({ text: "x" }), deps);
  assert.equal(res.headers.get("access-control-allow-origin"), "*"); assert.equal(res.headers.get("cache-control"), "no-store");
});
await test("health check: HEAD and GET ?ping=1 need no token", async () => {
  const { deps, rpcCalls } = setup();
  assert.equal((await cap.handle(new Request("https://x/f", { method: "HEAD" }), deps)).status, 200);
  const res = await cap.handle(new Request("https://x/f?ping=1"), deps);
  assert.equal(res.status, 200); assert.equal((await res.json()).ok, true); assert.equal(rpcCalls.length, 0);
});
await test("other methods are 405; database failure is a generic 500", async () => {
  const { deps } = setup();
  assert.equal((await cap.handle(new Request("https://x/f", { method: "DELETE" }), deps)).status, 405);
  const s = setup({ dbDown: true });
  const res = await cap.handle(post({ text: "x" }), s.deps);
  assert.equal(res.status, 500); assert.ok(!(await res.text()).includes("capture_add"));
});
await test("long spoken text is shortened in speech but stored in full", async () => {
  const { deps, inbox } = setup();
  const t = "Finish the whole problem set about thermodynamics and write up the lab report for Friday";
  const j = await (await cap.handle(post({ text: t }), deps)).json();
  assert.ok(j.speech.length <= 90 && j.speech.endsWith("...")); assert.equal(inbox[0].p_text, t);
});

console.log(`\n${passed} capture-task checks passed`);
