// Studyboard 1.11: send-reminders (Supabase Edge Function)
// Sends due reminders from reminder_queue to your devices with Web Push. A schedule in reminders.sql calls it
// every 5 minutes. Tapping Snooze or Mark Done on a notification also comes here, checked with that reminder's
// own random code, so it works without signing in and only for that one reminder.
//
// Secrets it needs (Edge Functions > Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com).
// Supabase adds SUPABASE_URL and the service key by itself.
// Deploy with "Verify JWT" turned off: the schedule and the notification buttons don't sign in.
// Nothing here trusts the caller: "send" only sends what is already due, and Snooze or Mark Done need the reminder's code.

import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import webpush from "npm:web-push@3.6.7";

const LATE_OK_MS = 6 * 3600_000;         // reminders more than 6 hours late (for example, a paused project) are skipped
const KEEP_MS = 14 * 86400_000;          // old rows are cleaned up after two weeks
const MAX_TRIES = 3;

type Row = { user_id: string; id: string; title: string; body: string; url: string; task_id: string; tok: string; tries: number };
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };
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

// ---------- The database parts (kept small so they can be swapped for a fake in tests) ----------
export function supabaseStore(db: any) {
  return {
    async claimDue(now: number): Promise<Row[]> {
      const { data, error } = await db.from("reminder_queue").update({ sent_at: new Date(now).toISOString() })
        .is("sent_at", null).lte("fire_at", new Date(now).toISOString()).gt("fire_at", new Date(now - LATE_OK_MS).toISOString())
        .select("user_id,id,title,body,url,task_id,tok,tries");
      if (error) throw error;
      return data || [];
    },
    async release(r: Row) {
      await db.from("reminder_queue").update({ sent_at: null, tries: (r.tries || 0) + 1 }).eq("user_id", r.user_id).eq("id", r.id);
    },
    async subsFor(users: string[]): Promise<Sub[]> {
      if (!users.length) return [];
      const { data, error } = await db.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth").in("user_id", users);
      if (error) throw error;
      // Push services always use https; anything else is never contacted (stops a made-up address being called from here).
      return (data || []).filter((s: Sub) => /^https:\/\/[^/\s]+/.test(String(s.endpoint || "")));
    },
    async dropSub(id: string) { await db.from("push_subscriptions").delete().eq("id", id); },
    async cleanup(now: number) { await db.from("reminder_queue").delete().lt("fire_at", new Date(now - KEEP_MS).toISOString()); },
    async byToken(id: string, tok: string): Promise<Row | null> {
      const { data } = await db.from("reminder_queue").select("user_id,id,title,body,url,task_id,tok,tries").eq("id", id).eq("tok", tok).maybeSingle();
      return data || null;
    },
    async addSnooze(r: Row, id: string, at: number) {
      const { error } = await db.from("reminder_queue").insert({ user_id: r.user_id, id, fire_at: new Date(at).toISOString(), title: r.title, body: r.body, url: r.url, task_id: r.task_id });
      if (error) throw error;
    },
    // Marks the task complete in your Studyboard data. Your open apps pick up the change through live sync.
    async markDone(userId: string, taskId: string, now: number): Promise<boolean> {
      const { data, error } = await db.from("items").select("data").eq("user_id", userId).eq("kind", "task").eq("id", taskId).maybeSingle();
      if (error || !data || !data.data) return false;
      const t = data.data;
      if (t.status !== "done") {
        t.status = "done"; t.doneAt = now;
        if (t.type !== "Exam" && t.type !== "Quiz") t.pct = 100;
        t.history = (Array.isArray(t.history) ? t.history : []).concat({ at: now, text: "Marked complete from a reminder" }).slice(-30);
        const up = await db.from("items").update({ data: t, updated_at: new Date(now).toISOString() }).eq("user_id", userId).eq("kind", "task").eq("id", taskId);
        if (up.error) return false;
      }
      await db.from("reminder_queue").delete().eq("user_id", userId).eq("task_id", taskId).is("sent_at", null);
      return true;
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

// ---------- Sending ----------
function payloadFor(r: Row, api: string, k: string): string {
  return JSON.stringify({ title: r.title || "Studyboard", body: r.body || "", rid: r.id, taskId: r.task_id || "", url: r.url || "", tok: r.tok || "", api, k });
}
async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); }));
}
// Sends one message to one device. "gone" means the device unsubscribed (404 or 410), so it's removed.
async function sendOne(push: Push, s: Sub, payload: string): Promise<"ok" | "gone" | "fail"> {
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
export async function sendDue(store: Store, push: Push, now: number, api: string, k: string) {
  const rows = await store.claimDue(now);
  const subs = await store.subsFor([...new Set(rows.map((r) => r.user_id))]);
  const byUser = new Map<string, Sub[]>();
  subs.forEach((s) => byUser.set(s.user_id, (byUser.get(s.user_id) || []).concat(s)));
  const gone = new Set<string>();
  let sent = 0, failed = 0;
  await pool(rows, 8, async (r) => {
    const mine = (byUser.get(r.user_id) || []).filter((s) => !gone.has(s.id));
    if (!mine.length) return;                                  // no devices: nothing to send, the row stays marked
    const payload = payloadFor(r, api, k);
    const res = await Promise.all(mine.map(async (s) => { const x = await sendOne(push, s, payload); if (x === "gone") gone.add(s.id); return x; }));
    if (res.includes("ok")) sent++;
    else if (res.includes("fail")) { failed++; if ((r.tries || 0) + 1 < MAX_TRIES) await store.release(r); }
  });
  for (const id of gone) await store.dropSub(id);
  await store.cleanup(now);
  return { due: rows.length, sent, failed, removed: gone.size };
}

export async function handle(req: Request, store: Store, push: Push, opts: { now?: number; api: string; k: string; vapidOk: boolean }) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: any = {};
  try { b = await req.json(); } catch (_e) { b = {}; }
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
  if (!opts.vapidOk) return json({ error: "The notification keys are missing or not valid. In Supabase open Edge Functions > Secrets and add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT." }, 500);
  if (action === "test") {
    const user = await store.userFrom(req);
    if (!user) return json({ error: "Sign in to Studyboard first, then try again." }, 401);
    const subs = await store.subsFor([user]);
    if (!subs.length) return json({ sent: 0, error: "No devices are set up yet. Turn notifications on for this device first." });
    const payload = JSON.stringify({ title: "Test Reminder", body: "Phone notifications are working. You're all set.", rid: "test:" + now.toString(36), taskId: "", url: "", tok: "", api: opts.api, k: opts.k });
    let sent = 0, removed = 0, failed = 0;
    for (const s of subs) { const x = await sendOne(push, s, payload); if (x === "ok") sent++; else if (x === "gone") { removed++; await store.dropSub(s.id); } else failed++; }
    return json({ sent, removed, failed, error: sent ? undefined : failed ? "Your devices didn't accept the test. Check that VAPID_PUBLIC_KEY matches the key Studyboard made, then turn notifications on again." : "Your devices were signed out of notifications. Turn them on again." });
  }
  return json(await sendDue(store, push, now, opts.api, opts.k));
}

// ---------- Start (only in Supabase, not in tests) ----------
const D = (globalThis as any).Deno;
if (D && typeof D.serve === "function") {
  const url = env("SUPABASE_URL"), pub = env("VAPID_PUBLIC_KEY"), priv = env("VAPID_PRIVATE_KEY");
  let vapidOk = false;
  try { if (pub && priv) { webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:studyboard@example.com", pub, priv); vapidOk = true; } }
  catch (e) { console.error("VAPID keys are not valid", String(e)); }
  const store = supabaseStore(createClient(url, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } }));
  D.serve((req: Request) => handle(req, store, webpush as unknown as Push, { api: url + "/functions/v1/send-reminders", k: env("SUPABASE_ANON_KEY"), vapidOk })
    .catch((e: unknown) => { console.error(e); return json({ error: "Something went wrong sending reminders. Check the function's logs in Supabase." }, 500); }));
}
