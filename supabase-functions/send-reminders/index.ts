// Studyboard 1.11

const LATE_OK_MS = 6 * 3600_000;
const KEEP_MS = 14 * 86400_000;
const MAX_TRIES = 3;
const BATCH = 200;
const MAX_BATCHES = 5;
const HORIZON_MS = 400 * 86400_000;

type Row = { user_id: string; id: string; title: string; body: string; url: string; task_id: string; tok: string; tries: number };
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; kind?: string; apns_env?: string | null };
type Result = "ok" | "gone" | "fail" | "skip";
type Msg = { title: string; body: string; rid: string; taskId: string; url: string; tok: string; api: string; k: string };
type Push = { sendNotification: (sub: unknown, payload: string, opts: unknown) => Promise<unknown>; setVapidDetails: (s: string, pub: string, priv: string) => void };

const env = (k: string): string => {
  try { return (globalThis as any).Deno?.env.get(k) ?? ""; } catch (_e) { return ""; }
};
function serviceKey(): string {
  const legacy = env("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}"); return keys.default || Object.values(keys)[0] || ""; } catch (_e) { return ""; }
}
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// The push services browsers and phones use
const PUSH_HOST = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|([a-z0-9-]+\.)+push\.services\.mozilla\.com|([a-z0-9-]+\.)+notify\.windows\.com|web\.push\.apple\.com|([a-z0-9-]+\.)+push\.apple\.com)$/;
export function pushHostOk(endpoint: unknown): boolean {
  const raw = String(endpoint || "");
  if (!/^https:\/\/[^/\s:@]+(\/\S*)?$/i.test(raw)) return false;
  try { const u = new URL(raw); return u.protocol === "https:" && !u.port && PUSH_HOST.test(u.hostname.toLowerCase()); } catch (_e) { return false; }
}
// Phone app tokens, as the app stores them
const FCM_RE = /^fcm:[A-Za-z0-9_:.-]{20,4096}$/, APNS_RE = /^apns:[0-9a-fA-F]{64,200}$/;
export function subOk(s: Sub): boolean {
  const kind = s.kind || "webpush";
  if (kind === "webpush") return pushHostOk(s.endpoint);
  if (kind === "fcm") return FCM_RE.test(String(s.endpoint || ""));
  if (kind === "apns") return APNS_RE.test(String(s.endpoint || ""));
  return false;
}
// Constant-time text compare (the schedule secret)
function same(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// The database parts (kept small so they can be swapped for a fake in tests)
export function supabaseStore(db: any) {
  return {
    // One bounded batch, oldest first, claimed in one step by studyboard_reminders_claim
    async claimDue(now: number, limit = BATCH): Promise<Row[]> {
      const at = new Date(now).toISOString();
      const { data, error } = await db.rpc("studyboard_reminders_claim", { p_now: at, p_late_ms: LATE_OK_MS, p_limit: limit });
      if (!error) return data || [];
      if (!/studyboard_reminders_claim|PGRST202|42883/.test(String(error.message || "") + " " + String(error.code || ""))) throw error;
      const pick = await db.from("reminder_queue").select("user_id,id").is("sent_at", null).lte("fire_at", at)
        .gt("fire_at", new Date(now - LATE_OK_MS).toISOString()).order("fire_at", { ascending: true }).limit(limit);
      if (pick.error) throw pick.error;
      const out: Row[] = [];
      for (const p of pick.data || []) {
        const r = await db.from("reminder_queue").update({ sent_at: at }).eq("user_id", p.user_id).eq("id", p.id).is("sent_at", null)
          .select("user_id,id,title,body,url,task_id,tok,tries");
        if (!r.error && r.data && r.data[0]) out.push(r.data[0]);
      }
      return out;
    },
    async release(r: Row) {
      await db.from("reminder_queue").update({ sent_at: null, tries: (r.tries || 0) + 1 }).eq("user_id", r.user_id).eq("id", r.id);
    },
    async subsFor(users: string[]): Promise<Sub[]> {
      if (!users.length) return [];
      let { data, error } = await db.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth,kind,apns_env").in("user_id", users);
      if (error && /kind|apns_env|42703/.test(String(error.message || error.code || ""))) ({ data, error } = await db.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth").in("user_id", users));
      if (error) throw error;
      return (data || []).filter((s: Sub) => subOk(s));
    },
    async dropSub(id: string) { await db.from("push_subscriptions").delete().eq("id", id); },
    async cleanup(now: number) {
      await db.from("reminder_queue").delete().lt("fire_at", new Date(now - KEEP_MS).toISOString());
      await db.from("reminder_queue").delete().gt("fire_at", new Date(now + HORIZON_MS).toISOString());
    },
    async byToken(id: string, tok: string): Promise<Row | null> {
      const { data } = await db.from("reminder_queue").select("user_id,id,title,body,url,task_id,tok,tries").eq("id", id).eq("tok", tok).maybeSingle();
      return data || null;
    },
    async addSnooze(r: Row, id: string, at: number) {
      const { error } = await db.from("reminder_queue").insert({ user_id: r.user_id, id, fire_at: new Date(at).toISOString(), title: r.title, body: r.body, url: r.url, task_id: r.task_id });
      if (error) throw error;
    },
    // Marks the task complete in your Studyboard data
    async markDone(userId: string, taskId: string, now: number): Promise<boolean> {
      for (let attempt = 0; ; attempt++) {
        const { data, error } = await db.from("items").select("data,updated_at").eq("user_id", userId).eq("kind", "task").eq("id", taskId).maybeSingle();
        if (error || !data || !data.data) return false;
        const t = data.data;
        if (t.status === "done") break;
        t.status = "done"; t.doneAt = now;
        if (t.type !== "Exam" && t.type !== "Quiz") t.pct = 100;
        t.history = (Array.isArray(t.history) ? t.history : []).concat({ at: now, text: "Marked complete from a reminder" }).slice(-30);
        let q = db.from("items").update({ data: t, updated_at: new Date(now).toISOString() }).eq("user_id", userId).eq("kind", "task").eq("id", taskId);
        q = data.updated_at ? q.eq("updated_at", data.updated_at) : q;
        const up = await q.select("id");
        if (up.error) return false;
        if (up.data && up.data.length) break;
        if (attempt >= 4) return false;
      }
      await db.from("reminder_queue").delete().eq("user_id", userId).eq("task_id", taskId).is("sent_at", null);
      return true;
    },
    // Is this the schedule secret from Vault
    async cronOk(secret: string): Promise<boolean> {
      if (!secret || secret.length < 32 || secret.length > 200) return false;
      const { data, error } = await db.rpc("studyboard_reminders_cron_ok", { p_secret: secret });
      return !error && data === true;
    },
    async userFrom(req: Request): Promise<string | null> {
      const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!jwt || !jwt.startsWith("eyJ")) return null;
      const { data } = await db.auth.getUser(jwt);
      return data && data.user ? data.user.id : null;
    },
  };
}
export type Store = ReturnType<typeof supabaseStore>;

// Phone apps: FCM (Android) and APNs (iPhone, iPad)
type NativeDeps = { env: (k: string) => string; fetch: typeof fetch; now: () => number; log?: (...a: unknown[]) => void };
const b64u = (b: Uint8Array | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : b;
  let s = ""; for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
function pemBytes(pem: string): Uint8Array {
  const body = String(pem || "").replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const raw = atob(body); const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
async function signJwt(header: Record<string, unknown>, claims: Record<string, unknown>, pem: string, alg: "RS256" | "ES256"): Promise<string> {
  const algo = alg === "RS256" ? { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" } : { name: "ECDSA", namedCurve: "P-256" };
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(pem), algo, false, ["sign"]);
  const input = b64u(JSON.stringify(header)) + "." + b64u(JSON.stringify(claims));
  // WebCrypto's ECDSA signature is already r||s (the JOSE form), so it goes in as is
  const sig = new Uint8Array(await crypto.subtle.sign(alg === "RS256" ? algo : { name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(input)));
  return input + "." + b64u(sig);
}

// Sends to the phone apps
export function nativeSender(d: NativeDeps) {
  const log = d.log || ((...a: unknown[]) => console.warn(...a));
  let fcmTok = "", fcmUntil = 0, apnsJwt = "", apnsAt = 0;
  const sa = (): any => { try { const j = JSON.parse(d.env("FCM_SERVICE_ACCOUNT") || ""); return j && j.client_email && j.private_key ? j : null; } catch (_e) { return null; } };
  const apnsOk = () => !!(d.env("APNS_KEY_P8") && d.env("APNS_KEY_ID") && d.env("APNS_TEAM_ID"));

  async function fcmAccess(acc: any): Promise<string> {
    if (fcmTok && d.now() < fcmUntil) return fcmTok;
    const iat = Math.floor(d.now() / 1000);
    const jwt = await signJwt({ alg: "RS256", typ: "JWT" }, { iss: acc.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3600 }, acc.private_key, "RS256");
    const r = await d.fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }).toString() });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) throw new Error("fcm token " + r.status);
    fcmTok = String(j.access_token); fcmUntil = d.now() + Math.max(60, Number(j.expires_in) || 3600) * 1000 - 60_000;
    return fcmTok;
  }
  async function apnsToken(): Promise<string> {
    if (apnsJwt && d.now() - apnsAt < 50 * 60_000) return apnsJwt;
    apnsAt = d.now();
    apnsJwt = await signJwt({ alg: "ES256", kid: d.env("APNS_KEY_ID") }, { iss: d.env("APNS_TEAM_ID"), iat: Math.floor(apnsAt / 1000) }, d.env("APNS_KEY_P8"), "ES256");
    return apnsJwt;
  }

  async function fcm(s: Sub, m: Msg): Promise<Result> {
    const acc = sa();
    if (!acc) return "skip";
    const project = d.env("FIREBASE_PROJECT_ID") || acc.project_id;
    if (!project) return "skip";
    try {
      const token = await fcmAccess(acc);
      const body = { message: { token: s.endpoint.slice(4), notification: { title: m.title, body: m.body },
        data: { taskId: m.taskId, rid: m.rid, url: m.url, tok: m.tok, api: m.api, k: m.k },
        android: { priority: "HIGH", ttl: "21600s" } } };
      const r = await d.fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(project)}/messages:send`, {
        method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) return "ok";
      const t = await r.text().catch(() => "");
      if (r.status === 404 || /UNREGISTERED/.test(t)) return "gone";
      if (r.status === 400 && /INVALID_ARGUMENT/.test(t) && /token/i.test(t)) return "gone";
      if (r.status === 401) { fcmTok = ""; fcmUntil = 0; }
      log("fcm failed", r.status, t.slice(0, 200));
      return "fail";
    } catch (e) { log("fcm failed", String((e as Error)?.message || e).slice(0, 200)); return "fail"; }
  }

  async function apns(s: Sub, m: Msg): Promise<Result> {
    if (!apnsOk()) return "skip";
    const dev = s.endpoint.slice(5).toLowerCase();
    const hosts = s.apns_env === "sandbox" ? ["api.sandbox.push.apple.com"] : s.apns_env === "production" ? ["api.push.apple.com"] : ["api.push.apple.com", "api.sandbox.push.apple.com"];
    try {
      const jwt = await apnsToken();
      const payload = JSON.stringify({ aps: { alert: { title: m.title, body: m.body }, sound: "default" }, taskId: m.taskId, rid: m.rid, url: m.url, tok: m.tok, api: m.api, k: m.k });
      for (let i = 0; i < hosts.length; i++) {
        const r = await d.fetch(`https://${hosts[i]}/3/device/${dev}`, { method: "POST", body: payload, headers: {
          authorization: "bearer " + jwt, "apns-topic": d.env("APNS_TOPIC") || "com.studioso.app", "apns-push-type": "alert", "apns-priority": "10",
          "apns-expiration": String(Math.floor(d.now() / 1000) + 6 * 3600), "content-type": "application/json" } });
        if (r.ok) return "ok";
        const t = await r.text().catch(() => "");
        if (r.status === 410) return "gone";
        if (r.status === 400 && /BadDeviceToken/.test(t)) { if (i < hosts.length - 1) continue; return "gone"; }
        if (r.status === 403 && /ProviderToken/.test(t)) { apnsJwt = ""; apnsAt = 0; }
        log("apns failed", r.status, t.slice(0, 200));
        return "fail";
      }
      return "fail";
    } catch (e) { log("apns failed", String((e as Error)?.message || e).slice(0, 200)); return "fail"; }
  }
  return { fcm, apns, configured: () => !!sa() || apnsOk() };
}
export type Native = ReturnType<typeof nativeSender>;

// Sending
function msgFor(r: Row, api: string, k: string): Msg {
  return { title: r.title || "Studyboard", body: r.body || "", rid: r.id, taskId: r.task_id || "", url: r.url || "", tok: r.tok || "", api, k };
}
async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); }));
}
// Sends one message to one device
async function sendOne(push: Push | null, s: Sub, m: Msg, native?: Native): Promise<Result> {
  if (!subOk(s)) return "gone";
  const kind = s.kind || "webpush";
  if (kind === "fcm") return native ? native.fcm(s, m) : "skip";
  if (kind === "apns") return native ? native.apns(s, m) : "skip";
  if (!push) return "skip";
  const payload = JSON.stringify(m);
  try {
    await push.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: "high" });
    return "ok";
  } catch (e: any) {
    const code = Number(e && e.statusCode);
    if (code === 404 || code === 410) return "gone";
    console.warn("push failed", code || "", String((e && e.body) || (e && e.message) || e).slice(0, 200));
    return "fail";
  }
}
export async function sendDue(store: Store, push: Push | null, now: number, api: string, k: string, native?: Native) {
  const gone = new Set<string>(), retry: Row[] = [];
  let due = 0, sent = 0, failed = 0;
  // A batch at a time
  for (let b = 0; b < MAX_BATCHES; b++) {
    const rows = await store.claimDue(now, BATCH);
    due += rows.length;
    const subs = await store.subsFor([...new Set(rows.map((r) => r.user_id))]);
    const byUser = new Map<string, Sub[]>();
    subs.forEach((s) => byUser.set(s.user_id, (byUser.get(s.user_id) || []).concat(s)));
    await pool(rows, 8, async (r) => {
      const mine = (byUser.get(r.user_id) || []).filter((s) => !gone.has(s.id));
      if (!mine.length) return;
      const m = msgFor(r, api, k);
      const res = await Promise.all(mine.map(async (s) => { const x = await sendOne(push, s, m, native); if (x === "gone") gone.add(s.id); return x; }));
      if (res.includes("ok")) sent++;
      else if (res.includes("fail")) { failed++; if ((r.tries || 0) + 1 < MAX_TRIES) retry.push(r); }
    });
    if (rows.length < BATCH) break;
  }
  for (const r of retry) await store.release(r);
  for (const id of gone) await store.dropSub(id);
  await store.cleanup(now);
  return { due, sent, failed, removed: gone.size };
}

// Reads the body but stops as soon as it passes max bytes (null = too big)
const MAX_BODY = 16_000;
export async function readLimited(req: Request, max: number): Promise<string | null> {
  const cl = Number(req.headers.get("content-length") || 0);
  if (cl > max) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = []; let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.byteLength;
    if (n > max) { try { await reader.cancel(); } catch (_e) { } return null; }
    chunks.push(value);
  }
  const all = new Uint8Array(n); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.byteLength; }
  return new TextDecoder().decode(all);
}

export async function handle(req: Request, store: Store, push: Push, opts: { now?: number; api: string; k: string; vapidOk: boolean; cronSecret?: string; native?: Native }) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const raw = await readLimited(req, MAX_BODY);
  if (raw === null) return json({ error: "Too large." }, 413);
  let b: any = {};
  try { b = JSON.parse(raw) || {}; } catch (_e) { b = {}; }
  const now = opts.now ?? Date.now();
  const action = String(b.action || "send");
  if (action === "snooze" || action === "done") {
    const id = String(b.id || "").slice(0, 200), tok = String(b.tok || "").slice(0, 100);
    if (!id || !tok) return json({ error: "Missing reminder." }, 400);
    const r = await store.byToken(id, tok);
    if (!r) return json({ error: "That reminder wasn't found. It may be too old." }, 404);
    if (action === "snooze") {
      const min = Math.max(5, Math.min(24 * 60, Math.round(Number(b.minutes) || 60)));
      const base = r.id.replace(/^s:/, "").slice(0, 150);
      await store.addSnooze(r, `s:${base}:${now.toString(36)}`, now + min * 60_000);
      return json({ ok: true, snoozedUntil: new Date(now + min * 60_000).toISOString() });
    }
    if (!r.task_id) return json({ error: "This reminder isn't about a task." }, 400);
    const ok = await store.markDone(r.user_id, r.task_id, now);
    return ok ? json({ ok: true }) : json({ error: "That task wasn't found." }, 404);
  }
  if (action !== "test") {
    // "send" (the default) only for the schedule
    if (action !== "send") return json({ error: "Unknown action." }, 400);
    const given = (req.headers.get("x-studyboard-cron") || "").trim();
    const ok = opts.cronSecret ? same(given, opts.cronSecret) : await store.cronOk(given).catch(() => false);
    if (!ok) return json({ error: "Not allowed." }, 401);
  }
  const web = opts.vapidOk ? push : null;
  if (!opts.vapidOk && !(opts.native && opts.native.configured())) return json({ error: "The notification keys are missing or not valid. In Supabase open Edge Functions > Secrets and add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT." }, 500);
  if (action === "test") {
    const user = await store.userFrom(req);
    if (!user) return json({ error: "Sign in to Studyboard first, then try again." }, 401);
    const subs = await store.subsFor([user]);
    if (!subs.length) return json({ sent: 0, error: "No devices are set up yet. Turn notifications on for this device first." });
    const m: Msg = { title: "Test Reminder", body: "Phone notifications are working. You're all set.", rid: "test:" + now.toString(36), taskId: "", url: "", tok: "", api: opts.api, k: opts.k };
    let sent = 0, removed = 0, failed = 0, skipped = 0;
    for (const s of subs) { const x = await sendOne(web, s, m, opts.native); if (x === "ok") sent++; else if (x === "gone") { removed++; await store.dropSub(s.id); } else if (x === "skip") skipped++; else failed++; }
    return json({ sent, removed, failed, skipped, error: sent ? undefined : skipped && !failed ? "This server isn't set up to send to this kind of device yet (its push secrets are missing in Supabase > Edge Functions > Secrets)." : failed ? "Your devices didn't accept the test. Check that VAPID_PUBLIC_KEY matches the key Studyboard made, then turn notifications on again." : "Your devices were signed out of notifications. Turn them on again." });
  }
  return json(await sendDue(store, web, now, opts.api, opts.k, opts.native));
}

// Start (only in Supabase, not in tests)
const D = (globalThis as any).Deno;
if (D && typeof D.serve === "function") {
  // Loaded here (not at the top) so the offline tests can load this file without Deno's npm
  const { createClient } = await import("npm:@supabase/supabase-js@2.117.2");
  const webpush = (await import("npm:web-push@3.6.7")).default;
  const url = env("SUPABASE_URL"), pub = env("VAPID_PUBLIC_KEY"), priv = env("VAPID_PRIVATE_KEY");
  let vapidOk = false;
  try { if (pub && priv) { webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:studyboard@example.com", pub, priv); vapidOk = true; } }
  catch (e) { console.error("VAPID keys are not valid", String(e)); }
  const native = nativeSender({ env, fetch, now: Date.now });
  const store = supabaseStore(createClient(url, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } }));
  D.serve((req: Request) => handle(req, store, webpush as unknown as Push, { api: url + "/functions/v1/send-reminders", k: env("SUPABASE_ANON_KEY"), vapidOk, cronSecret: env("REMINDERS_CRON_SECRET"), native })
    .catch((e: unknown) => { console.error(e); return json({ error: "Something went wrong sending reminders. Check the function's logs in Supabase." }, 500); }));
}
