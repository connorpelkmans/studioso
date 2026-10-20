// node tests/site-worker.test.js: the website worker passes the sign-in return addresses through to Supabase unchanged, and serves
// everything else from the static files.
const assert = require("assert"), path = require("path"), {pathToFileURL} = require("url");
(async () => {
  const W = (await import(pathToFileURL(path.join(__dirname, "..", "cloudflare", "site", "worker.js")).href)).default;
  const seen = [];
  global.fetch = async req => { seen.push({url: req.url, method: req.method, cookie: req.headers.get("cookie"), redirect: req.redirect, body: req.body ? await req.text() : ""});
    return new Response(null, {status: 302, headers: {Location: "https://accounts.google.com/o/oauth2/v2/auth?x=1", "Set-Cookie": "sbcf=abc; Path=/functions/v1/cloud-files; HttpOnly; Secure"}}); };
  const env = {SUPABASE_URL: "https://proj.supabase.co", ASSETS: {fetch: async req => new Response("asset:" + new URL(req.url).pathname)}};
  let n = 0; const ok = (c, m) => { assert(c, m); n++; console.log("ok -", m); };

  const r1 = await W.fetch(new Request("https://studyboardapp.com/functions/v1/cloud-files?begin=s.t", {headers: {cookie: "a=1"}}), env);
  ok(seen[0].url === "https://proj.supabase.co/functions/v1/cloud-files?begin=s.t", "the return address goes to the Supabase function, query kept: " + seen[0].url);
  ok(seen[0].cookie === "a=1" && seen[0].redirect === "manual", "with the browser's cookie, and redirects are not followed");
  ok(r1.status === 302 && /accounts\.google\.com/.test(r1.headers.get("location")) && /Path=\/functions\/v1\/cloud-files/.test(r1.headers.get("set-cookie")), "the function's redirect and cookie come back unchanged");

  await W.fetch(new Request("https://studyboardapp.com/functions/v1/calendar-sync", {method: "POST", headers: {"content-type": "application/x-www-form-urlencoded"}, body: "confirm=box"}), env);
  ok(seen[1].method === "POST" && seen[1].body === "confirm=box" && /calendar-sync$/.test(seen[1].url), "the confirm form (a POST) goes through with its body");

  global.fetch = async () => new Response("<!doctype html><p>Connect?</p>", {status: 200, headers: {"content-type": "text/plain", "x-studyboard-page": "html"}});
  const r5 = await W.fetch(new Request("https://studyboardapp.com/functions/v1/cloud-files?code=1&state=2"), env);
  ok(r5.headers.get("content-type") === "text/html; charset=utf-8" && !r5.headers.get("x-studyboard-page") && /Connect\?/.test(await r5.text()), "a connect page Supabase sends as text is shown as a page");
  global.fetch = async req => { seen.push({url: req.url}); return new Response("x"); };
  const r3 = await W.fetch(new Request("https://studyboardapp.com/functions/v1/delete-account"), env);
  ok(seen.length === 2 && (await r3.text()) === "asset:/functions/v1/delete-account", "no other function is reachable through the website");
  const r4 = await W.fetch(new Request("https://studyboardapp.com/website/"), env);
  ok((await r4.text()) === "asset:/website/", "everything else is the static site");
  console.log(n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
