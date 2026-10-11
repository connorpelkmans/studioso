// Offline checks for the capture-email Edge Function (Email to Studyboard). No network, no Supabase. Run from the repo root:
//   node --experimental-strip-types supabase-functions/tools/test-capture-email.mjs
// It loads the real function file with a fake database that answers like capture_add_email() in supabase-capture.sql.
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fn = await import(pathToFileURL(path.resolve(root, "supabase-functions/capture-email/index.ts")).href);
let passed = 0;
const test = async (name, f) => { try { await f(); passed++; console.log("ok   " + name); } catch (e) { console.error("FAIL " + name + "\n" + (e.stack || e)); process.exitCode = 1; } };
const SECRET = "x".repeat(40), KEY = "k7m2p9x4qrst";

function setup(answer = { ok: true, dup: false }, opts = {}) {
  const logs = [], calls = [];
  const f = async (url, init = {}) => {
    assert.ok(String(url).endsWith("/rest/v1/rpc/capture_add_email"), "only capture_add_email is called");
    assert.equal(init.headers.Authorization, "Bearer svc-key");
    calls.push(JSON.parse(init.body));
    if (opts.dbDown) return new Response("boom", { status: 500 });
    return Response.json(answer);
  };
  const env = (k) => ({ SUPABASE_URL: "https://x.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "svc-key", EMAIL_CAPTURE_SECRET: opts.secret ?? SECRET }[k] ?? "");
  return { deps: { env, fetch: f, now: () => 1_800_000_000_000, log: (...a) => logs.push(a.join(" ")) }, logs, calls };
}
const post = (body, secret = SECRET) => new Request("https://x/functions/v1/capture-email", { method: "POST", headers: { "content-type": "application/json", ...(secret ? { "x-studyboard-email-secret": secret } : {}) }, body: typeof body === "string" ? body : JSON.stringify(body) });
const MAIL = { to: `${KEY}@in.studyboard.example`, from: "prof@school.edu", subject: "Lab moved", text: "Lab 4 is due Friday.", id: "abc@school" };

await test("an email for a known address is handed to the database", async () => {
  const { deps, calls, logs } = setup();
  const r = await fn.handle(post(MAIL), deps);
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { ok: true, dup: false });
  assert.deepEqual(calls[0], { p_key: KEY, p_from: "prof@school.edu", p_subject: "Lab moved", p_body: "Lab 4 is due Friday.", p_msgid: "abc@school" });
  assert.ok(!logs.join("").includes(KEY) && !logs.join("").includes("prof@") && !logs.join("").includes("Lab"), "the log never holds the key, sender or text");
});
await test("the key is read from the recipient: case, angle brackets and a +tag", async () => {
  assert.equal(fn.keyOf("K7M2P9X4QRST+bio@in.x"), KEY);
  assert.equal(fn.keyOf(` <${KEY}@in.x> `), KEY);
  assert.equal(fn.keyOf("abcdefghijkl@in.x"), null, "i and l are not in the alphabet");
  assert.equal(fn.keyOf("k7m2p9x4qrs@in.x"), null, "11 characters");
  assert.equal(fn.keyOf("not an address"), null);
});
await test("a wrong or missing secret is refused before anything else", async () => {
  for (const s of ["", "y".repeat(40), SECRET + "x"]) {
    const { deps, calls } = setup();
    const r = await fn.handle(post(MAIL, s), deps);
    assert.equal(r.status, 401); assert.equal(calls.length, 0);
  }
});
await test("a function without its secret (or a short one) does nothing", async () => {
  const { deps, calls } = setup(undefined, { secret: "short" });
  const r = await fn.handle(post(MAIL, "short"), deps);
  assert.equal(r.status, 500); assert.equal(calls.length, 0);
});
await test("an address that can't be a key is 404 without asking the database", async () => {
  const { deps, calls } = setup();
  const r = await fn.handle(post({ ...MAIL, to: "hello@in.x" }), deps);
  assert.equal(r.status, 404); assert.equal(calls.length, 0);
});
await test("the database's answers become the Worker's answers", async () => {
  const cases = [[{ ok: true, dup: true }, 200], [{ ok: false, error: "unknown" }, 404], [{ ok: false, error: "pro_required" }, 402], [{ ok: false, error: "rate_limited", retry_after: 900 }, 429], [{ ok: false, error: "inbox_full" }, 429], [{ ok: false, error: "bad_input" }, 400], [{ ok: false, error: "weird" }, 500]];
  for (const [a, status] of cases) { const { deps } = setup(a); const r = await fn.handle(post(MAIL), deps); assert.equal(r.status, status, JSON.stringify(a)); if (a.retry_after) assert.equal(r.headers.get("retry-after"), "900"); }
  const { deps } = setup(undefined, { dbDown: true }); assert.equal((await fn.handle(post(MAIL), deps)).status, 500);
});
await test("long fields are cut before they are sent; bad bodies and big requests are refused", async () => {
  const { deps, calls } = setup();
  await fn.handle(post({ ...MAIL, subject: "s".repeat(5000), text: "t".repeat(50000), from: "f".repeat(500) }), deps);
  assert.equal(calls[0].p_subject.length, 1000); assert.equal(calls[0].p_body.length, 20000); assert.equal(calls[0].p_from.length, 200);
  assert.equal((await fn.handle(post("not json"), setup().deps)).status, 404, "nothing usable means no address");
  assert.equal((await fn.handle(post("[1,2]"), setup().deps)).status, 400);
  assert.equal((await fn.handle(post({ ...MAIL, text: "x".repeat(70000) }), setup().deps)).status, 413);
  assert.equal((await fn.handle(new Request("https://x/", { method: "GET" }), setup().deps)).status, 405);
});
await test("secrets compare in constant time and only when equal", async () => {
  assert.ok(fn.sameSecret("abc", "abc")); assert.ok(!fn.sameSecret("abc", "abd")); assert.ok(!fn.sameSecret("", "")); assert.ok(!fn.sameSecret("abc", "abcd"));
});
console.log(`\ncapture-email: ${passed} checks passed`);
