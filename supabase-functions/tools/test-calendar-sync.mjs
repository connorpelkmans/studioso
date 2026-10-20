// Offline checks for the calendar-sync Edge Function (two-way Google Calendar and Outlook sync). No network, no Supabase. Run from the repo root:
//   node --experimental-strip-types supabase-functions/tools/test-calendar-sync.mjs
// It loads the real function with in-memory stand-ins for Supabase (Auth and the calsync_* functions of supabase-calsync.sql), Google
// Calendar and Microsoft Graph, and walks the whole thing: connect, sync, moves and deletions in the calendar, busy times, reauth, disconnect.
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const F = await import(pathToFileURL(path.resolve(root, "supabase-functions/calendar-sync/index.ts")).href);
let passed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log("ok   " + name); } catch (e) { console.error("FAIL " + name + "\n" + (e.stack || e)); process.exitCode = 1; } };
const UID = "11111111-2222-4333-8444-555555555555", TZ = "America/Toronto", NOW = Date.parse("2026-10-11T16:00:00Z");
const SECRET = "k".repeat(48);

// ---------- A small world: Supabase + Google + Microsoft ----------
function world(opts = {}) {
  const db = { accounts: new Map(), map: new Map(), allowed: opts.allowed !== false };
  const g = { cals: new Map([["primary", new Map()]]), n: 0, tokens: { refresh: "g-refresh-1" }, revoked: [], badGrant: false, calls: [] };
  const ms = { cals: new Map([["msprimary", new Map()]]), n: 0, calls: [] };
  const logs = [];
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  const key = (u, p) => u + "|" + p;
  const RPC = {
    calsync_allowed: () => db.allowed,
    calsync_account: a => { const x = db.accounts.get(key(a.p_uid, a.p_provider)); return x ? [x] : []; },
    calsync_status: a => [...db.accounts.values()].filter(x => x.user_id === a.p_uid).map(x => ({ provider: x.provider, account: x.account, status: x.status, last_sync: x.last_sync, sent: [...db.map.values()].filter(m => m.user_id === a.p_uid && m.provider === x.provider && !m.gone).length })),
    calsync_connect: a => { const k = key(a.p_uid, a.p_provider), old = db.accounts.get(k); if (!old || old.cal_id !== a.p_cal_id) for (const [mk, m] of db.map) if (m.user_id === a.p_uid && m.provider === a.p_provider) db.map.delete(mk);
      db.accounts.set(k, { user_id: a.p_uid, provider: a.p_provider, account: a.p_account, refresh_enc: a.p_refresh_enc, cal_id: a.p_cal_id, status: "ok", lock_until: 0, last_sync: null }); return null; },
    calsync_update: a => { const x = db.accounts.get(key(a.p_uid, a.p_provider)); if (!x) return null; if (a.p_refresh_enc) x.refresh_enc = a.p_refresh_enc; if (a.p_status) x.status = a.p_status; if (a.p_cal_id) { x.cal_id = a.p_cal_id; for (const [mk, m] of db.map) if (m.user_id === a.p_uid && m.provider === a.p_provider) db.map.delete(mk); } return null; },
    calsync_disconnect: a => { db.accounts.delete(key(a.p_uid, a.p_provider)); for (const [mk, m] of db.map) if (m.user_id === a.p_uid && m.provider === a.p_provider) db.map.delete(mk); return null; },
    calsync_lock: a => { const x = db.accounts.get(key(a.p_uid, a.p_provider)); if (!x || x.lock_until > Date.now()) return false; x.lock_until = Date.now() + 60000; return true; },
    calsync_unlock: a => { const x = db.accounts.get(key(a.p_uid, a.p_provider)); if (x) { x.lock_until = 0; if (a.p_synced) x.last_sync = "now"; } return null; },
    calsync_map_get: a => [...db.map.values()].filter(m => m.user_id === a.p_uid && m.provider === a.p_provider).map(m => ({ sb_key: m.sb_key, ext_id: m.ext_id, hash: m.hash, ext_start: m.ext_start, ext_end: m.ext_end, gone: m.gone })),
    calsync_map_save: a => { (a.p_drop || []).forEach(k => db.map.delete(a.p_uid + "|" + a.p_provider + "|" + k)); (a.p_rows || []).forEach(r => db.map.set(a.p_uid + "|" + a.p_provider + "|" + r.k, { user_id: a.p_uid, provider: a.p_provider, sb_key: r.k, ext_id: r.ext_id, hash: r.hash || "", ext_start: r.ext_start || "", ext_end: r.ext_end || "", gone: !!r.gone })); return (a.p_rows || []).length; },
  };
  const gEvent = (cal, b, id) => ({ id, status: "confirmed", summary: b.summary, location: b.location, start: b.start, end: b.end, transparency: b.transparency, extendedProperties: b.extendedProperties });
  const fetch = async (url, init = {}) => {
    const u = new URL(String(url)), m = (init.method || "GET").toUpperCase(), body = init.body && typeof init.body === "string" && init.body[0] === "{" ? JSON.parse(init.body) : init.body;
    if (u.host === "x.supabase.co") {
      if (u.pathname === "/auth/v1/user") return (init.headers.Authorization === "Bearer user-jwt") ? json({ id: UID }) : json({}, 401);
      if (u.pathname === "/auth/v1/admin/users/" + UID) { assert.equal(init.headers.Authorization, "Bearer svc"); return json({ id: UID, email: "hannah@school.edu" }); }
      const name = u.pathname.replace("/rest/v1/rpc/", "");
      assert.equal(init.headers.Authorization, "Bearer svc", "the database is only asked with the service key");
      if (!RPC[name]) throw new Error("unknown rpc " + name);
      return json(RPC[name](JSON.parse(init.body)));
    }
    if (u.host === "oauth2.googleapis.com") {
      g.calls.push(m + " " + u.pathname);
      if (u.pathname === "/revoke") { g.revoked.push(u.searchParams.get("token")); return json({}); }
      const f = new URLSearchParams(init.body);
      assert.equal(f.get("client_secret"), "g-secret");
      if (f.get("grant_type") === "authorization_code") { assert.equal(f.get("code"), "good-code"); assert.equal(f.get("redirect_uri"), "https://x.supabase.co/functions/v1/calendar-sync");
        return json({ access_token: "g-access", refresh_token: g.tokens.refresh, id_token: "h." + Buffer.from(JSON.stringify({ email: "student@gmail.com" })).toString("base64url") + ".s" }); }
      if (f.get("grant_type") === "refresh_token") return g.badGrant ? json({ error: "invalid_grant" }, 400) : (assert.equal(f.get("refresh_token"), g.tokens.refresh), json({ access_token: "g-access" }));
    }
    if (u.host === "www.googleapis.com") {
      assert.equal(init.headers.Authorization, "Bearer g-access"); g.calls.push(m + " " + u.pathname);
      const parts = u.pathname.replace("/calendar/v3/", "").split("/").map(decodeURIComponent);
      if (parts[0] === "calendars" && parts.length === 1 && m === "POST") { const id = "sbcal" + (++g.n); g.cals.set(id, new Map()); g.tz = body.timeZone; return json({ id }); }
      if (g.noRead && parts[1] === "primary") return json({ error: "insufficientPermissions" }, 403);
      const cal = g.cals.get(parts[1]); if (!cal) return json({ error: "nf" }, 404);
      if (parts.length === 2) { if (m === "DELETE") { g.cals.delete(parts[1]); return new Response(null, { status: 204 }); } return json({ id: parts[1] }); }
      if (parts[2] === "events" && parts.length === 3 && m === "POST") { const id = "ge" + (++g.n); cal.set(id, gEvent(parts[1], body, id)); return json({ id }); }
      if (parts[2] === "events" && parts.length === 3) {
        const lo = Date.parse(u.searchParams.get("timeMin")), hi = Date.parse(u.searchParams.get("timeMax"));
        const at = s => s.date ? Date.parse(s.date + "T12:00:00Z") : Date.parse(s.dateTime);
        return json({ items: [...cal.values()].filter(e => at(e.start) >= lo && at(e.start) < hi) });
      }
      const ev = cal.get(parts[3]);
      if (m === "GET") return ev ? json(ev) : json({}, 404);
      if (m === "PUT") { if (!ev) return json({}, 404); cal.set(parts[3], gEvent(parts[1], body, parts[3])); return json({ id: parts[3] }); }
      if (m === "DELETE") { if (!ev) return json({}, 410); cal.delete(parts[3]); return new Response(null, { status: 204 }); }
    }
    if (u.host === "login.microsoftonline.com") { const f = new URLSearchParams(init.body); assert.ok(/Calendars\.ReadWrite/.test(f.get("scope"))); return json({ access_token: "m-access", refresh_token: f.get("grant_type") === "refresh_token" ? "m-refresh-2" : "m-refresh-1" }); }
    if (u.host === "graph.microsoft.com") {
      assert.equal(init.headers.Authorization, "Bearer m-access"); ms.calls.push(m + " " + u.pathname);
      const p = u.pathname.replace("/v1.0/me/", "");
      if (p === "" || p === "me") return json({ mail: "student@outlook.com" });
      if (u.pathname === "/v1.0/me") return json({ mail: "student@outlook.com" });
      if (p === "calendars" && m === "GET") return json({ value: [...ms.cals.keys()].filter(k => k !== "msprimary").map(id => ({ id, name: "Studyboard" })) });
      if (p === "calendars" && m === "POST") { const id = "mcal" + (++ms.n); ms.cals.set(id, new Map()); return json({ id }); }
      const mm = /^calendars\/([^/]+)(\/events|\/calendarView)?$/.exec(p);
      if (mm && !mm[2]) return ms.cals.has(decodeURIComponent(mm[1])) ? json({ id: mm[1] }) : json({}, 404);
      if (mm && mm[2] === "/events") { const id = "me" + (++ms.n); ms.cals.get(decodeURIComponent(mm[1])).set(id, { id, ...body }); return json({ id }); }
      if ((mm && mm[2] === "/calendarView") || p === "calendar/calendarView") { const c = ms.cals.get(mm ? decodeURIComponent(mm[1]) : "msprimary"); return json({ value: [...c.values()] }); }
      const em = /^events\/(.+)$/.exec(p);
      if (em && m === "GET") { for (const c of ms.cals.values()) if (c.has(em[1])) return json(c.get(em[1])); return json({}, 404); }
      if (em) { for (const c of ms.cals.values()) if (c.has(em[1])) { if (m === "DELETE") c.delete(em[1]); else c.set(em[1], { id: em[1], ...body }); return m === "DELETE" ? new Response(null, { status: 204 }) : json({ id: em[1] }); } return json({}, 404); }
    }
    throw new Error("unexpected " + m + " " + url);
  };
  const env = k => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc", SUPABASE_ANON_KEY: "anon", CALSYNC_KEY: opts.key ?? SECRET,
    GOOGLE_CLIENT_ID: "g-id", GOOGLE_CLIENT_SECRET: "g-secret", GOOGLE_CALENDAR_READ: opts.googleRead ? "1" : "", MS_CLIENT_ID: opts.noMs ? "" : "m-id", MS_CLIENT_SECRET: opts.noMs ? "" : "m-secret" }[k] ?? "");
  const deps = { env, fetch, now: () => NOW, log: (...a) => logs.push(a.join(" ")) };
  const call = async (body, jwt = "user-jwt") => { const r = await F.handle(new Request("https://x.supabase.co/functions/v1/calendar-sync", { method: "POST", headers: { authorization: "Bearer " + jwt, "content-type": "application/json" }, body: JSON.stringify(body) }), deps); return { status: r.status, body: await r.json() }; };
  const get = async (qs, cookie) => { const r = await F.handle(new Request("https://x.supabase.co/functions/v1/calendar-sync?" + qs, { headers: cookie ? { cookie } : {} }), deps); return { status: r.status, text: await r.text(), csp: r.headers.get("content-security-policy"), location: r.headers.get("location"), cookie: (r.headers.get("set-cookie") || "").split(";")[0] }; };
  const post = async (form, cookie) => { const r = await F.handle(new Request("https://x.supabase.co/functions/v1/calendar-sync", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", ...(cookie ? { cookie } : {}) }, body: new URLSearchParams(form).toString() }), deps); return { status: r.status, text: await r.text(), cookie: r.headers.get("set-cookie") || "" }; };
  // The whole connect flow: start (app) -> begin (sets the cookie, on to Google) -> back with a code -> the confirm page -> Connect
  const connect = async (provider = "google") => {
    const s = await call({ action: "start", provider, tz: TZ });
    const b = await get(new URL(s.body.url).search.slice(1));
    const st = new URL(b.location).searchParams.get("state");
    const c = await get(new URLSearchParams({ code: "good-code", state: st }).toString(), b.cookie);
    const box = (/name="confirm" value="([^"]+)"/.exec(c.text) || [])[1];
    const done = box ? await post({ confirm: box.replace(/&amp;/g, "&") }, b.cookie) : c;
    return Object.assign(done, { begin: b, confirmPage: c, state: st, box });
  };
  return { db, g, ms, logs, call, get, post, connect, deps };
}
const EV = (extra = []) => [
  { k: "t:lab3", title: "Due: Lab report 3 · BIO101", date: "2026-10-16", start: "17:00", end: "17:30", allDay: false, note: "BIO101 · Lab" },
  { k: "t:mid", title: "Midterm · BIO101", date: "2026-10-20", start: "09:00", end: "11:00", allDay: false, busy: true, where: "Hall B" },
  { k: "m:c1:2026-10-13|10:00|Lecture", title: "BIO101 Lecture", date: "2026-10-13", start: "10:00", end: "11:20", allDay: false, busy: true },
  { k: "t:read", title: "Due: Reading ch 4", date: "2026-10-14", allDay: true },
].concat(extra);
const SYNC = (events, more = {}) => ({ action: "sync", provider: "google", tz: TZ, from: "2026-10-04", to: "2026-12-10", events, bring: "off", ...more });
const studyCal = w => [...w.g.cals.entries()].find(([k]) => k !== "primary")[1];

await test("time zones: wall clock to UTC and back, across a DST change", async () => {
  assert.equal(new Date(F.zonedMs(TZ, "2026-10-16", "17:00")).toISOString(), "2026-10-16T21:00:00.000Z");
  assert.equal(new Date(F.zonedMs(TZ, "2026-11-02", "17:00")).toISOString(), "2026-11-02T22:00:00.000Z", "after the fall-back");
  assert.deepEqual(F.wallOf(TZ, Date.parse("2026-11-02T22:00:00Z")), { date: "2026-11-02", time: "17:00" });
  assert.deepEqual(F.wallSpan({ s: "D2026-10-14", e: "D2026-10-17" }, TZ), { allDay: true, date: "2026-10-14", endDate: "2026-10-16" }, "all-day ends are exclusive in calendars");
  assert.deepEqual(F.wallSpan({ s: "T" + Date.parse("2026-10-16T21:00:00Z"), e: "T" + Date.parse("2026-10-17T05:00:00Z") }, TZ), { allDay: false, date: "2026-10-16", start: "17:00", end: "23:59" }, "past midnight ends the day");
});
await test("what the app sends is checked: keys, titles, dates in the window, times", async () => {
  assert.equal(F.cleanWant({ k: "x:1", title: "a", date: "2026-10-12" }, "2026-10-01", "2026-12-01"), null, "unknown key kind");
  assert.equal(F.cleanWant({ k: "t:1", title: " ", date: "2026-10-12" }, "2026-10-01", "2026-12-01"), null, "no title");
  assert.equal(F.cleanWant({ k: "t:1", title: "a", date: "2027-01-12" }, "2026-10-01", "2026-12-01"), null, "outside the window");
  assert.equal(F.cleanWant({ k: "t:1", title: "a", date: "2026-02-30" }, "2026-01-01", "2026-12-01"), null, "not a real date");
  const w = F.cleanWant({ k: "t:1", title: "a‮<b>\n", date: "2026-10-12", start: "25:00" }, "2026-10-01", "2026-12-01");
  assert.ok(w.allDay && w.title === "a <b>", "a bad time makes it all day; control and direction characters go: " + JSON.stringify(w.title));
});
await test("not signed in, not Pro, not set up", async () => {
  const w = world();
  assert.equal((await w.call({ action: "status" }, "nope")).status, 401);
  const w2 = world({ allowed: false });
  assert.equal((await w2.call({ action: "start", provider: "google" })).status, 402);
  const w3 = world({ key: "short" });
  assert.equal((await w3.call({ action: "status" })).status, 501);
  const w4 = world({ noMs: true });
  const st = await w4.call({ action: "status" });
  assert.deepEqual(st.body.providers, { google: true, microsoft: false });
  assert.equal((await w4.call({ action: "start", provider: "microsoft" })).status, 501);
});
await test("connecting: Google's page, the callback, an encrypted token and the Studyboard calendar", async () => {
  const w = world();
  const s = await w.call({ action: "start", provider: "google", tz: TZ });
  assert.ok(s.body.url.startsWith("https://x.supabase.co/functions/v1/calendar-sync?begin="), "Connect goes through the function first");
  const page = await w.connect();
  const u = new URL(page.begin.location);
  assert.equal(page.begin.status, 302); assert.ok(/^sbcs=[A-Za-z0-9_-]+$/.test(page.begin.cookie), "begin sets this browser's cookie");
  assert.equal(u.host, "accounts.google.com"); assert.equal(u.searchParams.get("access_type"), "offline");
  assert.ok(/calendar\.app\.created/.test(u.searchParams.get("scope")) && !/auth\/calendar(\s|$)/.test(u.searchParams.get("scope")), "only the narrow scopes");
  assert.ok(/Connect <b>student@gmail\.com<\/b> to the Studyboard account <b>hannah@school\.edu<\/b>/.test(page.confirmPage.text), "the person is asked, and sees the full Studyboard account");
  assert.ok(/Only continue if this is your Studyboard account\.<\/b> If someone sent you this link, close this page\./.test(page.confirmPage.text), "and is warned about links from someone else");
  assert.ok(/form-action 'self'/.test(page.confirmPage.csp) && !/<script/.test(page.confirmPage.text), "the confirm page runs nothing");
  assert.equal(page.status, 200); assert.ok(/Connected to Google Calendar/.test(page.text) && /student@gmail\.com/.test(page.text));
  const a = w.db.accounts.get(UID + "|google");
  assert.ok(a && a.cal_id === "sbcal1" && a.account === "student@gmail.com" && w.g.tz === TZ, "the calendar is made in the person's time zone");
  assert.ok(!a.refresh_enc.includes("g-refresh-1") && /^v1\./.test(a.refresh_enc), "the token is stored encrypted");
  assert.equal(await F.unseal(SECRET, a.refresh_enc, UID, "google"), "g-refresh-1");
  await assert.rejects(F.unseal(SECRET, a.refresh_enc, "99999999-2222-4333-8444-555555555555", "google"), "a token copied to another account can't be opened");
  const st = await w.call({ action: "status" });
  assert.equal(st.body.accounts[0].account, "student@gmail.com"); assert.ok(!JSON.stringify(st.body).includes("refresh"), "status never shows a token");
});
await test("someone else's link does nothing: no cookie, a forged or expired state, a replayed confirm", async () => {
  const w = world();
  // The attacker starts a connection for THEIR account and sends the victim Google's link (or the begin link's target)
  const s = await w.call({ action: "start", provider: "google", tz: TZ });
  const b = await w.get(new URL(s.body.url).search.slice(1));
  const st = new URL(b.location).searchParams.get("state");
  const victim = await w.get(new URLSearchParams({ code: "good-code", state: st }).toString());
  assert.equal(victim.status, 400); assert.ok(/wasn't started in this browser/.test(victim.text));
  assert.equal((await w.get(new URLSearchParams({ code: "good-code", state: st }).toString(), "sbcs=wrongnonce12")).status, 400);
  assert.equal(w.db.accounts.size, 0, "nothing was stored");
  // Before Connect is pressed, nothing is stored either
  const c = await w.get(new URLSearchParams({ code: "good-code", state: st }).toString(), b.cookie);
  assert.equal(w.db.accounts.size, 0, "the confirm page alone stores nothing");
  const box = /name="confirm" value="([^"]+)"/.exec(c.text)[1].replace(/&amp;/g, "&");
  assert.equal((await w.post({ confirm: box }, "sbcs=other0000")).status, 400, "the confirm needs the same browser");
  assert.equal((await w.post({ confirm: box.slice(0, -4) + "AAAA" }, b.cookie)).status, 400, "a changed confirm is refused");
  assert.equal(w.db.accounts.size, 0);
  assert.equal((await w.get("code=good-code&state=abc.def")).status, 400);
  const old = await F.signState(SECRET, { u: UID, p: "google", e: Math.floor(NOW / 1000) - 5 });
  assert.equal((await w.get(new URLSearchParams({ code: "good-code", state: old }).toString(), b.cookie)).status, 400);
  assert.equal((await w.get("begin=" + encodeURIComponent(old))).status, 400, "an old begin link is refused");
  const other = await F.signState("z".repeat(48), { u: UID, p: "google", e: Math.floor(NOW / 1000) + 600 });
  assert.equal((await w.get(new URLSearchParams({ code: "good-code", state: other }).toString())).status, 400);
  assert.equal(w.db.accounts.size, 0);
  const denied = await w.get("error=access_denied&state=" + encodeURIComponent(st), b.cookie);
  assert.ok(/Not connected/.test(denied.text));
});
await test("bodies are capped while they arrive (a chunked body without Content-Length too)", async () => {
  const w = world();
  const big = (n) => new ReadableStream({ start(c) { for (let i = 0; i < n; i++) c.enqueue(new TextEncoder().encode("x".repeat(1000))); c.close(); } });
  const form = await F.handle(new Request("https://x.supabase.co/functions/v1/calendar-sync", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: big(20), duplex: "half" }), w.deps);
  assert.equal(form.status, 400, "the confirm form stops at 9000 bytes");
  const api = await F.handle(new Request("https://x.supabase.co/functions/v1/calendar-sync", { method: "POST", headers: { authorization: "Bearer user-jwt", "content-type": "application/json" }, body: big(1300), duplex: "half" }), w.deps);
  assert.equal(api.status, 400, "a signed-in call stops at 1.2 MB");
  assert.equal(await F.readLimited(new Request("https://x/", { method: "POST", body: "héllo" }), 10), "héllo");
});
await test("the first sync writes everything; the next one writes nothing", async () => {
  const w = world(); await w.connect();
  const r = await w.call(SYNC(EV()));
  assert.equal(r.status, 200); assert.equal(r.body.stats.created, 4); assert.equal(r.body.more, false);
  const cal = studyCal(w), lab = [...cal.values()].find(e => e.summary === "Due: Lab report 3 · BIO101");
  assert.deepEqual(lab.start, { dateTime: "2026-10-16T21:00:00.000Z", timeZone: TZ });
  assert.equal(lab.transparency, "transparent", "a deadline doesn't make you look busy");
  assert.equal([...cal.values()].find(e => /Midterm/.test(e.summary)).transparency, "opaque", "an exam does");
  assert.deepEqual([...cal.values()].find(e => /Reading/.test(e.summary)).start, { date: "2026-10-14" });
  assert.equal(w.db.map.size, 4);
  const before = w.g.calls.length;
  const r2 = await w.call(SYNC(EV()));
  assert.deepEqual([r2.body.stats.created, r2.body.stats.updated, r2.body.stats.removed], [0, 0, 0]);
  assert.ok(w.g.calls.slice(before).every(c => !/^(POST|PUT|DELETE) \/calendar\/v3\/calendars\/sbcal1\/events/.test(c)), "no writes");
  assert.equal(w.db.accounts.get(UID + "|google").last_sync, "now");
});
await test("changes in Studyboard: a new time is written, a removed item is taken off", async () => {
  const w = world(); await w.connect(); await w.call(SYNC(EV()));
  const ev = EV(); ev[0] = { ...ev[0], start: "23:00", end: "23:30" }; ev.pop();
  const r = await w.call(SYNC(ev));
  assert.deepEqual([r.body.stats.updated, r.body.stats.removed], [1, 1]);
  const cal = studyCal(w);
  assert.equal([...cal.values()].find(e => /Lab report/.test(e.summary)).start.dateTime, "2026-10-17T03:00:00.000Z");
  assert.ok(![...cal.values()].some(e => /Reading/.test(e.summary)));
});
await test("moved in the calendar: Studyboard hears about it; deleted there: it isn't sent again", async () => {
  const w = world(); await w.connect(); await w.call(SYNC(EV()));
  const cal = studyCal(w), lab = [...cal.values()].find(e => /Lab report/.test(e.summary)), mid = [...cal.values()].find(e => /Midterm/.test(e.summary));
  lab.start = { dateTime: "2026-10-17T14:00:00-04:00" }; lab.end = { dateTime: "2026-10-17T14:30:00-04:00" };
  cal.delete(mid.id);
  const r = await w.call(SYNC(EV()));
  assert.deepEqual(r.body.changes.find(c => c.k === "t:lab3"), { k: "t:lab3", allDay: false, date: "2026-10-17", start: "14:00", end: "14:30" });
  assert.deepEqual(r.body.changes.find(c => c.k === "t:mid"), { k: "t:mid", deleted: true });
  assert.equal(r.body.stats.created, 0, "the deleted midterm is not put back");
  assert.equal(lab.start.dateTime, "2026-10-17T14:00:00-04:00", "the moved event is left where the person put it");
  // The app takes the move: its next sync sends the new time, and nothing fights
  const ev = EV(); ev[0] = { ...ev[0], date: "2026-10-17", start: "14:00", end: "14:30" };
  const r2 = await w.call(SYNC(ev));
  assert.equal(r2.body.changes.length, 0); assert.equal(r2.body.stats.created, 0);
  const r3 = await w.call(SYNC(ev));
  assert.deepEqual([r3.body.stats.created, r3.body.stats.updated], [0, 0], "settled");
  // A school deadline the app won't move: it sends the old time, which goes back into the calendar
  const lab2 = [...cal.values()].find(e => /Lab report/.test(e.summary));
  lab2.start = { dateTime: "2026-10-18T10:00:00-04:00" }; lab2.end = { dateTime: "2026-10-18T10:30:00-04:00" };
  const moved = await w.call(SYNC(ev));
  assert.equal(moved.body.changes[0].date, "2026-10-18");
  const r4 = await w.call(SYNC(ev));
  assert.equal(r4.body.stats.updated, 1);
  assert.equal([...cal.values()].find(e => /Lab report/.test(e.summary)).start.dateTime, "2026-10-17T18:00:00.000Z");
});
await test("an event moved far ahead in the calendar is found, not taken as deleted; old rows are forgotten", async () => {
  const w = world(); await w.connect(); await w.call(SYNC(EV()));
  const cal = studyCal(w), lab = [...cal.values()].find(e => /Lab report/.test(e.summary));
  lab.start = { dateTime: "2027-03-01T10:00:00-05:00" }; lab.end = { dateTime: "2027-03-01T10:30:00-05:00" };
  const r = await w.call(SYNC(EV()));
  assert.deepEqual(r.body.changes, [{ k: "t:lab3", allDay: false, date: "2027-03-01", start: "10:00", end: "10:30" }]);
  w.db.map.set(UID + "|google|t:ancient", { user_id: UID, provider: "google", sb_key: "t:ancient", ext_id: "gone-long-ago", hash: "x", ext_start: "D2026-07-01", ext_end: "D2026-07-02", gone: false });
  const before = studyCal(w).size;
  await w.call(SYNC(EV()));
  assert.ok(!w.db.map.has(UID + "|google|t:ancient"), "a row long past is dropped");
  assert.equal(studyCal(w).size, before, "and nothing in the calendar is touched for it");
});
await test("at most 60 writes per call, soonest first; the app calls again for the rest", async () => {
  const w = world(); await w.connect();
  const many = Array.from({ length: 75 }, (_, i) => ({ k: "t:x" + i, title: "T" + i, date: F.addDays("2026-10-12", i % 50), allDay: true }));
  const r = await w.call(SYNC(many));
  assert.equal(r.body.stats.created, 60); assert.equal(r.body.more, true);
  const r2 = await w.call(SYNC(many));
  assert.equal(r2.body.stats.created, 15); assert.equal(r2.body.more, false);
  assert.equal((await w.call(SYNC(Array.from({ length: 801 }, (_, i) => ({ k: "t:y" + i, title: "x", date: "2026-10-20", allDay: true }))))).status, 400, "800 at most");
});
await test("reading the person's own Google calendar is off unless GOOGLE_CALENDAR_READ=1: no read scope, nothing read", async () => {
  const w = world(); const page = await w.connect();
  const scope = new URL(page.begin.location).searchParams.get("scope");
  assert.ok(/calendar\.app\.created/.test(scope) && !/calendar\.events\.readonly/.test(scope), "Google is only asked for calendar.app.created: " + scope);
  w.g.cals.get("primary").set("p1", { id: "p1", status: "confirmed", summary: "Shift", start: { dateTime: "2026-10-12T13:00:00-04:00" }, end: { dateTime: "2026-10-12T17:00:00-04:00" } });
  w.g.calls.length = 0;
  const r = await w.call(SYNC(EV(), { bring: "titles" }));
  assert.equal(r.status, 200); assert.deepEqual(r.body.busy, [], "nothing comes in (an empty list clears what came before)"); assert.equal(r.body.busyErr, "");
  assert.ok(!w.g.calls.some(c => /calendars\/primary/.test(c)), "the primary calendar is never asked for");
  const st = await w.call({ action: "status" });
  assert.equal(st.body.reads.google, false); assert.equal(st.body.reads.microsoft, true);
  const on = world({ googleRead: true }), pg = await on.connect();
  assert.ok(/calendar\.events\.readonly/.test(new URL(pg.begin.location).searchParams.get("scope")), "switched back on, the read scope is asked for again");
});
await test("the person's own calendar: every event with titles (all-day ones too), or just the busy time", async () => {
  const w = world({ googleRead: true }); await w.connect();
  const p = w.g.cals.get("primary");
  p.set("p1", { id: "p1", status: "confirmed", summary: "Shift at café", location: "Main St", start: { dateTime: "2026-10-12T13:00:00-04:00" }, end: { dateTime: "2026-10-12T17:00:00-04:00" } });
  p.set("p2", { id: "p2", status: "confirmed", summary: "Mom's birthday", transparency: "transparent", start: { date: "2026-10-13" }, end: { date: "2026-10-14" } });
  p.set("p3", { id: "p3", status: "confirmed", summary: "Trip", start: { date: "2026-10-20" }, end: { date: "2026-10-23" } });
  const r = await w.call(SYNC(EV(), { bring: "titles" }));
  assert.equal(r.body.busy.length, 3, "with titles, every event comes in, all-day ones too (Google marks them free)");
  assert.ok(r.body.busy.some(b => b.title === "Mom's birthday" && b.allDay), "the all-day one is there");
  const shift = r.body.busy.find(b => b.title === "Shift at café");
  assert.deepEqual({ ...shift, id: "" }, { id: "", title: "Shift at café", where: "Main St", allDay: false, date: "2026-10-12", start: "13:00", end: "17:00" });
  assert.ok(/^[0-9a-f]{20}$/.test(shift.id), "a stable id that isn't the calendar's own");
  assert.deepEqual(r.body.busy.find(b => b.title === "Trip"), { id: r.body.busy.find(b => b.title === "Trip").id, title: "Trip", where: "", allDay: true, date: "2026-10-20", endDate: "2026-10-22" });
  const r2 = await w.call(SYNC(EV(), { bring: "busy" }));
  assert.ok(r2.body.busy.every(b => b.title === "Busy" && b.where === ""), "busy only: no titles or places leave the calendar");
  assert.equal(r2.body.busy.length, 2, "busy only: free time is left out");
  // Reading their calendar wasn't allowed (Google lets people untick it): the rest of the sync still works, and the app is told
  w.g.noRead = true;
  const r3 = await w.call(SYNC(EV(), { bring: "titles" }));
  assert.equal(r3.status, 200); assert.equal(r3.body.busy, null); assert.equal(r3.body.busyErr, "no_access");
  w.g.noRead = false;
  assert.equal((await w.call(SYNC(EV(), { bring: "off" }))).body.busy, null);
});
await test("allowing access again when Google stops accepting the token", async () => {
  const w = world(); await w.connect(); w.g.badGrant = true;
  const r = await w.call(SYNC(EV()));
  assert.equal(r.status, 409); assert.equal(r.body.error, "reauth");
  assert.equal(w.db.accounts.get(UID + "|google").status, "reauth");
  w.g.badGrant = false; await w.connect();
  assert.equal(w.db.accounts.get(UID + "|google").status, "ok"); assert.equal((await w.call(SYNC(EV()))).status, 200);
});
await test("one sync at a time; the lock is let go afterwards, even after an error", async () => {
  const w = world(); await w.connect();
  w.db.accounts.get(UID + "|google").lock_until = Date.now() + 30000;
  assert.equal((await w.call(SYNC(EV()))).body.error, "busy");
  w.db.accounts.get(UID + "|google").lock_until = 0;
  const realList = w.g.cals.get("sbcal1"); w.g.cals.delete("sbcal1");   // the person deleted the Studyboard calendar
  const r = await w.call(SYNC(EV()));
  assert.equal(r.status, 200); assert.equal(r.body.stats.created, 4, "a deleted Studyboard calendar is made again and filled");
  assert.ok(realList && w.db.accounts.get(UID + "|google").cal_id === "sbcal2" && w.db.accounts.get(UID + "|google").lock_until === 0);
});
await test("disconnect: the token is revoked, the calendar removed if asked, the rows gone", async () => {
  const w = world(); await w.connect(); await w.call(SYNC(EV()));
  const r = await w.call({ action: "disconnect", provider: "google", remove: true });
  assert.equal(r.status, 200);
  assert.deepEqual(w.g.revoked, ["g-refresh-1"]); assert.ok(!w.g.cals.has("sbcal1"));
  assert.equal(w.db.accounts.size, 0); assert.equal(w.db.map.size, 0);
  assert.ok(!w.logs.join("\n").match(/g-refresh|g-access|Lab report|student@/), "logs hold no tokens, titles or addresses");
});
await test("Outlook: connect, sync (times in UTC, all-day at midnight), moves come back", async () => {
  const w = world(); const page = await w.connect("microsoft");
  assert.ok(/Connected to Outlook/.test(page.text));
  const r = await w.call({ ...SYNC(EV()), provider: "microsoft" });
  assert.equal(r.body.stats.created, 4);
  const cal = w.ms.cals.get("mcal1"), lab = [...cal.values()].find(e => /Lab report/.test(e.subject));
  assert.deepEqual(lab.start, { dateTime: "2026-10-16T21:00:00", timeZone: "UTC" }); assert.equal(lab.showAs, "free");
  const read = [...cal.values()].find(e => /Reading/.test(e.subject));
  assert.ok(read.isAllDay && read.start.dateTime === "2026-10-14T00:00:00" && read.end.dateTime === "2026-10-15T00:00:00");
  assert.equal(w.db.accounts.get(UID + "|microsoft").account, "student@outlook.com");
  lab.start = { dateTime: "2026-10-16T22:00:00.0000000", timeZone: "UTC" }; lab.end = { dateTime: "2026-10-16T22:30:00.0000000", timeZone: "UTC" };
  const r2 = await w.call({ ...SYNC(EV()), provider: "microsoft" });
  assert.deepEqual(r2.body.changes, [{ k: "t:lab3", allDay: false, date: "2026-10-16", start: "18:00", end: "18:30" }]);
  const ra = await F.unseal(SECRET, w.db.accounts.get(UID + "|microsoft").refresh_enc, UID, "microsoft");
  assert.equal(ra, "m-refresh-2", "Microsoft's new refresh token replaces the old one");
});
await test("an event the person adds to the Studyboard calendar comes into Studyboard, then syncs both ways without copies", async () => {
  const w = world(); await w.connect(); await w.call(SYNC(EV()));
  const cal = studyCal(w);
  cal.set("mine1", { id: "mine1", status: "confirmed", summary: "Dentist", location: "Main St", start: { dateTime: "2026-10-15T18:00:00Z" }, end: { dateTime: "2026-10-15T19:00:00Z" } });
  cal.set("mine2", { id: "mine2", status: "confirmed", summary: "Reading week", start: { date: "2026-10-19" }, end: { date: "2026-10-24" } });
  const r = await w.call(SYNC(EV()));
  assert.equal(r.status, 200);
  const den = r.body.added.find(a => a.title === "Dentist"), wk = r.body.added.find(a => a.title === "Reading week");
  assert.ok(den && /^cgn[0-9a-f]{20}$/.test(den.id), "a new event comes back with a Studyboard id: " + JSON.stringify(r.body.added));
  assert.deepEqual({ date: den.date, start: den.start, end: den.end, allDay: den.allDay, where: den.where }, { date: "2026-10-15", start: "14:00", end: "15:00", allDay: false, where: "Main St" }, "in the person's time zone");
  assert.deepEqual({ date: wk.date, endDate: wk.endDate, allDay: wk.allDay }, { date: "2026-10-19", endDate: "2026-10-23", allDay: true }, "a multi-day event keeps its days");
  assert.equal(r.body.added.length, 2, "Studyboard's own events are never taken in");
  assert.equal(cal.size, 6);
  // A device that doesn't have them yet syncs: nothing is deleted, they're offered again
  const r2 = await w.call(SYNC(EV()));
  assert.equal(cal.size, 6, "not deleted by a device that hasn't got them yet");
  assert.deepEqual(r2.body.added.map(a => a.id).sort(), [den.id, wk.id].sort(), "offered again, same ids");
  // The app now sends them the way it stores them: no writes, no copies, and they're settled
  const mine = [{ k: `e:${den.id}:2026-10-15`, title: "Dentist", date: "2026-10-15", start: "14:00", end: "15:00", allDay: false, busy: true, where: "Main St", note: "" },
    { k: `e:${wk.id}:2026-10-19`, title: "Reading week", date: "2026-10-19", endDate: "2026-10-23", allDay: true, busy: false, where: "", note: "" }];
  const r3 = await w.call(SYNC(EV(mine)));
  assert.deepEqual([r3.body.stats.created, r3.body.stats.updated, r3.body.added.length], [0, 0, 0], "already there: nothing written, nothing added: " + JSON.stringify(r3.body.stats));
  assert.equal(cal.size, 6);
  // Changed in Studyboard: the calendar event is updated (not a new one)
  const r4 = await w.call(SYNC(EV([Object.assign({}, mine[0], { title: "Dentist (moved room)" }), mine[1]])));
  assert.equal(r4.body.stats.updated, 1); assert.equal(cal.get("mine1").summary, "Dentist (moved room)"); assert.equal(cal.size, 6);
  // Deleted in the calendar: the app hears about it
  cal.delete("mine2");
  const r5 = await w.call(SYNC(EV([Object.assign({}, mine[0], { title: "Dentist (moved room)" }), mine[1]])));
  assert.ok(r5.body.changes.some(c => c.k === mine[1].k && c.deleted), "deleted there");
  // Deleted in Studyboard: removed from the calendar
  const r6 = await w.call(SYNC(EV()));
  assert.equal(r6.body.stats.removed, 1); assert.ok(!cal.has("mine1"));
});
await test("a Studyboard event whose link was lost is never taken in as a copy", async () => {
  const a = await F.adopt({ id: "x", x: { s: "D2026-10-14", e: "D2026-10-15" }, title: "Due: thing", where: "", ours: true }, "google", TZ, "2026-10-01", "2026-12-01");
  assert.equal(a, null);
  const b = await F.adopt({ id: "y", x: { s: "D2027-03-14", e: "D2027-03-15" }, title: "Far away", where: "" }, "google", TZ, "2026-10-01", "2026-12-01");
  assert.equal(b, null, "outside the window");
  const c = await F.adopt({ id: "z", x: { s: "T" + Date.parse("2026-10-15T18:00:00Z"), e: "T" + Date.parse("2026-10-15T18:00:00Z") }, title: "", where: "" }, "microsoft", TZ, "2026-10-01", "2026-12-01");
  assert.ok(/^cmn/.test(c.ev.id) && c.ev.title === "Event" && c.ev.end === "15:00", "no title and no length: named Event, an hour long, as the app stores it");
});
console.log(`\ncalendar-sync: ${passed} checks passed`);
