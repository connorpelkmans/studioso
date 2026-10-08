// Unit test for the Supabase keep-awake Worker (cloudflare/supabase-ping/src/index.js). Run: node tests/supabase-ping.test.js
const path = require("path"), assert = require("assert"), {pathToFileURL} = require("url");
(async () => {
  const P = await import(pathToFileURL(path.join(__dirname, "..", "cloudflare", "supabase-ping", "src", "index.js")).href);
  const env = {SUPABASE_URL: "https://x.supabase.co/", SUPABASE_KEY: "sb_publishable_x"};
  let seen = null;
  const answer = status => async (url, o) => { seen = {url, key: o.headers.apikey}; return new Response("[]", {status}); };
  assert.deepStrictEqual(await P.ping(env, answer(200)), {ok: true, status: 200}, "a normal answer");
  assert.strictEqual(seen.url, "https://x.supabase.co/rest/v1/items?select=id&limit=1", "reads one row through the REST API");
  assert.strictEqual(seen.key, "sb_publishable_x", "with the publishable key");
  assert.strictEqual((await P.ping(env, answer(401))).ok, true, "a refusal from the database still counts as reaching it");
  assert.strictEqual((await P.ping(env, answer(503))).ok, false, "a 5xx means the project may be paused or down");
  assert.strictEqual((await P.ping(env, async () => { throw new Error("offline"); })).ok, false, "no answer");
  assert.strictEqual((await P.ping({}, answer(200))).ok, false, "settings missing");
  await assert.rejects(P.default.scheduled({}, Object.assign({}, env, {SUPABASE_URL: "http://insecure"}), {}), /ping failed/, "a failed scheduled run is an error in the dashboard");
  console.log("supabase-ping: 8 checks passed");
})().catch(e => { console.error(e); process.exit(1); });
