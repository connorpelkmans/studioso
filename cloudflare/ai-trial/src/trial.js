// Studyboard AI trial: everything except the Cloudflare wiring (src/index.js), so tests/ai-trial.test.js can run it in Node.
//
// A signed-in student with a confirmed email gets a few free AI tries (TRIAL_USES in all, DAILY_USES a day) on a small Workers AI model,
// until they add their own free Gemini key. Only jobs they start themselves come here; Automatic AI never uses the trial.
//
// Never billed: the account must stay on the Workers FREE plan, where going over a limit only makes requests fail. On top of that this
// Worker keeps its own count of neurons per UTC day and stops at DAILY_NEURONS (never more than HARD_CEILING, below the free 10,000),
// reserving each request's worst case before the model runs, and it only uses models that run on the free plan (MODELS).
//
// Not a robot: when TURNSTILE_SITE_KEY and the TURNSTILE_SECRET secret are set, a student passes one Cloudflare Turnstile check before
// their first try. The check runs on this Worker's own /verify page (Turnstile only runs on real web addresses, so not inside the desktop
// or phone apps); the app opens it, the page reports the result here, and the app sees "verify" turn false.
//
//   GET  /v1/trial   {left, total, todayLeft, daily, verify}    how many tries this student has, and whether the check is still needed
//   POST /v1/verify/start                                      {url}: the check page for this student (link valid 15 minutes)
//   POST /v1/verify/finish  {nonce, token}                     from the check page: Turnstile's token, checked with siteverify
//   GET  /verify#<nonce>                                       the check page
//   POST /v1/ai      {task, system, text, schema?, maxTokens?, temperature?}
//                    200 {data, model, left, todayLeft, total}
//                    401 auth   403 unconfirmed | verify   413 too_long   429 used_up | today | busy   502 ai_failed

// Free-plan models only (none of them needs the Workers Paid plan), with Cloudflare's neurons per million tokens (pricing page, Oct 2026).
export const MODELS = {
  "@cf/google/gemma-4-26b-a4b-it": { in: 9091, out: 27273 },
  "@cf/qwen/qwen3-30b-a3b-fp8": { in: 4625, out: 30475 },
  "@cf/meta/llama-3.1-8b-instruct-fp8-fast": { in: 4119, out: 34868 },
  "@cf/openai/gpt-oss-20b": { in: 18182, out: 27273 }
};
export const DEFAULT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
export const HARD_CEILING = 9000;       // neurons per UTC day, whatever DAILY_NEURONS says (Workers AI's free allocation is 10,000)

const int = (v, d, lo, hi) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? Math.min(hi, Math.max(lo, n)) : d; };
export function config(env) {
  return {
    trialUses: int(env.TRIAL_USES, 15, 1, 200),
    dailyUses: int(env.DAILY_USES, 5, 1, 50),
    dailyNeurons: int(env.DAILY_NEURONS, 8000, 100, HARD_CEILING),
    model: MODELS[env.MODEL] ? env.MODEL : DEFAULT_MODEL,
    maxChars: int(env.MAX_CHARS, 16000, 1000, 40000),      // system prompt + text
    maxOut: int(env.MAX_OUTPUT_TOKENS, 1500, 200, 4000),
    turnstile: !!(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET)
  };
}
export const dayOf = now => new Date(now).toISOString().slice(0, 10);
// Deliberately high: English is about 4 characters a token, so 2 over-counts even for most other languages; plus the chat template.
export const estTokens = chars => Math.ceil(chars / 2) + 60;
export const neurons = (rates, inTok, outTok) => Math.ceil((inTok * rates.in + outTok * rates.out) / 1e6);

// One per student (Durable Object named by the Supabase user id). Durable Objects run one request at a time, so counts can't race.
export class Student {
  constructor(storage, now = () => Date.now()) { this.s = storage; this.now = now; }
  async read() {
    const [used, day, dayUsed] = [await this.s.get("used"), await this.s.get("day"), await this.s.get("dayUsed")];
    const today = dayOf(this.now());
    return { used: used || 0, dayUsed: day === today ? dayUsed || 0 : 0, today };
  }
  async status(cfg) {
    const r = await this.read(), left = Math.max(0, cfg.trialUses - r.used);
    return { left, total: cfg.trialUses, todayLeft: Math.min(left, Math.max(0, cfg.dailyUses - r.dayUsed)), daily: cfg.dailyUses, verify: !!cfg.turnstile && !(await this.s.get("human")) };
  }
  async setHuman() { await this.s.put("human", true); }
  // Counts the try before the model runs; refund() gives it back if the model then fails.
  async take(cfg) {
    const r = await this.read();
    if (r.used >= cfg.trialUses) return { ok: false, reason: "used_up" };
    if (r.dayUsed >= cfg.dailyUses) return { ok: false, reason: "today" };
    await this.s.put({ used: r.used + 1, day: r.today, dayUsed: r.dayUsed + 1 });
    return { ok: true, day: r.today };
  }
  async refund(day) {
    const r = await this.read();
    await this.s.put({ used: Math.max(0, r.used - 1), day: r.today, dayUsed: day === r.today ? Math.max(0, r.dayUsed - 1) : r.dayUsed });
  }
}

// One per UTC day (Durable Object named by the date): the neurons everyone's tries may use that day.
export class Pool {
  constructor(storage) { this.s = storage; }
  async spent() { return (await this.s.get("spent")) || 0; }
  async reserve(n, ceiling) {
    const spent = await this.spent();
    if (spent + n > ceiling) return false;
    await this.s.put("spent", spent + n);
    if (!(await this.s.getAlarm())) await this.s.setAlarm(Date.now() + 3 * 86400000);   // tidy up old days
    return true;
  }
  // Replace a reservation with what the model really used (never less than 0, and more if it somehow used more).
  async settle(reserved, actual) { const spent = await this.spent(); await this.s.put("spent", Math.max(0, spent - reserved + actual)); }
  async expire() { await this.s.deleteAll(); }
}

// The check page's link: <uid>.<expiry>.<HMAC of both with the Turnstile secret>, so only this Worker can make one and it can't be
// pointed at another student. It travels in the page's #fragment, which browsers don't send to any server.
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function hmac(secret, text) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(secret)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text)));
}
export async function makeNonce(secret, uid, now) { const exp = Math.floor(now / 1000) + 15 * 60; return `${uid}.${exp}.${await hmac(secret, uid + "." + exp)}`; }
export async function readNonce(secret, nonce, now) {
  const m = /^([A-Za-z0-9-]{1,64})\.(\d{9,11})\.([A-Za-z0-9_-]{43})$/.exec(String(nonce || "")); if (!m) return null;
  const want = await hmac(secret, m[1] + "." + m[2]);
  let diff = want.length ^ m[3].length; for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ (m[3].charCodeAt(i) || 0);
  return diff === 0 && Number(m[2]) * 1000 > now ? m[1] : null;
}
// Cloudflare's siteverify: the token must be fresh, unused, and from this widget's check with the "trial" action.
export async function siteverify(env, token, ip, fetchFn = fetch) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const res = await fetchFn("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip || undefined }) });
    const j = await res.json();
    return j && j.success === true && (!j.action || j.action === "trial");
  } catch (e) { return false; }
}

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400" };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

// Who is signed in: Supabase checks the token (GET /auth/v1/user). Answers are kept a few minutes so a burst of tries is one check.
const seen = new Map();
export async function verifyUser(token, env, fetchFn = fetch, now = Date.now()) {
  if (!token || token.length > 4096 || !env.SUPABASE_URL || !env.SUPABASE_KEY) return null;
  const hit = seen.get(token); if (hit && hit.until > now) return hit.user;
  let res;
  try { res = await fetchFn(String(env.SUPABASE_URL).replace(/\/+$/, "") + "/auth/v1/user", { headers: { apikey: env.SUPABASE_KEY, Authorization: "Bearer " + token } }); }
  catch (e) { return null; }
  if (!res.ok) return null;
  const u = await res.json().catch(() => null);
  if (!u || typeof u.id !== "string") return null;
  const user = { id: u.id, confirmed: !!(u.email_confirmed_at || u.confirmed_at || u.phone_confirmed_at), anonymous: u.is_anonymous === true };
  if (seen.size > 2000) seen.clear();
  seen.set(token, { user, until: now + 5 * 60000 });
  return user;
}
export const _forgetUsers = () => seen.clear();

// The app's answers are always JSON. The schema goes into the instructions (JSON mode keeps the reply to one object).
export function messagesFor(system, text, schema) {
  const sys = String(system || "").trim() + "\n\nReply with one JSON object only, no other text." + (schema ? " It must match this JSON Schema:\n" + JSON.stringify(schema) : "");
  return [{ role: "system", content: sys }, { role: "user", content: String(text || "") }];
}
export function readAnswer(out) {
  const c = out && (out.choices && out.choices[0] && out.choices[0].message ? out.choices[0].message.content : out.response);
  if (c && typeof c === "object") return c;
  const t = String(c || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(t); } catch (e) { /* fall through */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* not JSON */ } }
  return null;
}
const usageOf = out => { const u = out && out.usage; return u && Number.isFinite(u.prompt_tokens) && Number.isFinite(u.completion_tokens) ? u : null; };

// deps: {user(token), student(uid), pool(day), ai: {run(model, input)}, now()}
export async function handle(request, env, deps) {
  const url = new URL(request.url), cfg = config(env), now = deps.now ? deps.now() : Date.now();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (url.pathname === "/" && request.method === "GET") return new Response("Studyboard AI trial\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (url.pathname === "/verify" && request.method === "GET") return verifyPage(env);
  if (url.pathname === "/verify.js" && request.method === "GET") return new Response(VERIFY_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  if (url.pathname === "/v1/verify/finish" && request.method === "POST") {
    if (!cfg.turnstile) return json({ ok: true });
    let b = null; try { b = JSON.parse((await request.text()).slice(0, 8000)); } catch (e) { return json({ error: "bad" }, 400); }
    const uid = await readNonce(env.TURNSTILE_SECRET, b && b.nonce, now);
    if (!uid) return json({ error: "expired" }, 400);
    if (!(await (deps.siteverify || siteverify)(env, b.token, request.headers.get("CF-Connecting-IP")))) return json({ error: "failed" }, 403);
    await deps.student(uid).setHuman();
    return json({ ok: true });
  }
  if (!["/v1/trial", "/v1/ai", "/v1/verify/start"].includes(url.pathname)) return json({ error: "not_found" }, 404);
  if (String(env.TRIAL_OFF || "") === "1") return json({ error: "busy", left: 0, total: 0, todayLeft: 0, daily: 0 }, 429);   // off switch
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const user = await deps.user(token);
  if (!user || user.anonymous) return json({ error: "auth" }, 401);
  if (!user.confirmed) return json({ error: "unconfirmed" }, 403);
  const student = deps.student(user.id);
  if (url.pathname === "/v1/trial") return request.method === "GET" ? json(await student.status(cfg)) : json({ error: "method" }, 405);
  if (url.pathname === "/v1/verify/start") {
    if (request.method !== "POST") return json({ error: "method" }, 405);
    if (!cfg.turnstile) return json({ error: "off" }, 404);
    return json({ url: `${url.origin}/verify#${await makeNonce(env.TURNSTILE_SECRET, user.id, now)}` });
  }
  if (request.method !== "POST") return json({ error: "method" }, 405);

  let body = null;
  const raw = await request.text();
  if (raw.length > cfg.maxChars * 2 + 20000) return json({ error: "too_long" }, 413);
  try { body = JSON.parse(raw); } catch (e) { return json({ error: "bad" }, 400); }
  const system = typeof body.system === "string" ? body.system : "", text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return json({ error: "bad" }, 400);
  const schema = body.schema && typeof body.schema === "object" ? body.schema : null;
  const messages = messagesFor(system, text, schema), chars = messages.reduce((n, m) => n + m.content.length, 0);
  if (chars > cfg.maxChars + (schema ? JSON.stringify(schema).length : 0) + 200) return json({ error: "too_long" }, 413);
  const maxOut = Math.min(cfg.maxOut, int(body.maxTokens, cfg.maxOut, 50, cfg.maxOut));
  const temperature = Number.isFinite(body.temperature) ? Math.min(1, Math.max(0, body.temperature)) : 0.4;

  if ((await student.status(cfg)).verify) return json({ error: "verify", ...(await student.status(cfg)) }, 403);
  const take = await student.take(cfg);
  if (!take.ok) return json({ error: take.reason, ...(await student.status(cfg)) }, 429);
  const rates = MODELS[cfg.model], pool = deps.pool(dayOf(now)), reserve = neurons(rates, estTokens(chars), maxOut);
  if (!(await pool.reserve(reserve, cfg.dailyNeurons))) { await student.refund(take.day); return json({ error: "busy", ...(await student.status(cfg)) }, 429); }

  let out = null, failed = false;
  try {
    out = await deps.ai.run(cfg.model, { messages, max_completion_tokens: maxOut, temperature, response_format: { type: "json_object" }, chat_template_kwargs: { enable_thinking: false } });
  } catch (e) { failed = true; }
  const u = usageOf(out);
  // What the model really used, if it said; otherwise the whole reservation stays counted (never under-count).
  await pool.settle(reserve, u ? Math.min(reserve * 4, neurons(rates, u.prompt_tokens, u.completion_tokens)) : reserve);
  const data = failed ? null : readAnswer(out);
  if (!data || typeof data !== "object") { await student.refund(take.day); return json({ error: "ai_failed", ...(await student.status(cfg)) }, 502); }
  return json({ data, model: "Studyboard AI", truncated: !!(out && out.choices && out.choices[0] && out.choices[0].finish_reason === "length"), ...(await student.status(cfg)) });
}

const escAttr = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function verifyPage(env) {
  const html = VERIFY_HTML.replace("{{SITEKEY}}", escAttr(env.TURNSTILE_SITE_KEY || ""));
  return new Response(html, { headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  } });
}
const VERIFY_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Studyboard: Quick Check</title>
<style>
:root{color-scheme:light dark;--bg:#f7f5f0;--fg:#1d1b18;--sub:#5d5850;--card:#fff;--line:#dcd6cb}
@media (prefers-color-scheme:dark){:root{--bg:#171614;--fg:#eeeae2;--sub:#b3ada2;--card:#22201d;--line:#3a3732}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:30rem;margin:0 auto;padding:2rem 1rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.25rem;display:grid;gap:.75rem}
h1{font-size:1.35rem;margin:0}p{margin:0;color:var(--sub)}#msg{color:var(--fg);font-weight:600}
</style></head>
<body><main data-sitekey="{{SITEKEY}}"><div class="card">
<h1>Quick check before your free AI tries</h1>
<p>This one-time check keeps bots from using up the free AI that every student shares.</p>
<div id="box"></div>
<p id="msg" role="status"></p>
</div></main>
<script src="/verify.js"></script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=sbTurnstile&render=explicit" async defer></script>
</body></html>`;
export const VERIFY_JS = `(function(){
  var nonce = (location.hash || "").replace(/^#/, "");
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
  var msg = document.getElementById("msg");
  if (!/^[A-Za-z0-9-]{1,64}\\.\\d{9,11}\\.[A-Za-z0-9_-]{43}$/.test(nonce)) { msg.textContent = "This link is missing its code. Go back to Studyboard and tap the AI button again."; return; }
  window.sbTurnstile = function(){
    turnstile.render("#box", {sitekey: document.querySelector("main").getAttribute("data-sitekey"), action: "trial",
      callback: function(token){
        msg.textContent = "Checking…";
        fetch("/v1/verify/finish", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({nonce: nonce, token: token})})
          .then(function(r){ return r.ok; }, function(){ return false; })
          .then(function(ok){ msg.textContent = ok ? "Done. Go back to Studyboard: your free AI tries are ready." : "That didn't work. Go back to Studyboard and tap the AI button again."; });
      },
      "error-callback": function(){ msg.textContent = "The check couldn't load. Refresh this page to try again."; }
    });
  };
})();`;
