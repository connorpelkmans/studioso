// Studyboard: calendar-sync

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };
export type Provider = "google" | "microsoft";
export type Want = { k: string; title: string; date: string; endDate?: string; start?: string; end?: string; allDay: boolean; where?: string; note?: string; busy?: boolean };
export type Row = { sb_key: string; ext_id: string; hash: string; ext_start: string; ext_end: string; gone: boolean };
export type Ext = { s: string; e: string };

const PROVIDERS: Provider[] = ["google", "microsoft"];
// Reading the person's own Google calendar
export const googleReads = (d: Deps) => d.env("GOOGLE_CALENDAR_READ") === "1";
const MAX_EVENTS = 800, MAX_WRITES = 60, MAX_BUSY = 300, BUSY_DAYS = 28, POOL = 5;
const enc = new TextEncoder(), dec = new TextDecoder();

/* ================= Time (Intl only, so it is the same in Deno and Node) ================= */
const p2 = (n: number) => String(n).padStart(2, "0");
export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))) && new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))).toISOString().slice(0, 10) === s;
export const isTime = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const dMs = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
export const addDays = (s: string, n: number) => new Date(dMs(s) + n * 864e5).toISOString().slice(0, 10);
export function validTz(tz: unknown): tz is string { try { return typeof tz === "string" && tz.length < 64 && !!new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch (_e) { return false; } }
const fmts: Record<string, Intl.DateTimeFormat> = {};
function parts(tz: string, ms: number) {
  const f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  const o: Record<string, string> = {}; f.formatToParts(new Date(ms)).forEach(x => { o[x.type] = x.value; }); return o;
}
const offsetMin = (tz: string, ms: number) => { const o = parts(tz, ms); return Math.round((Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second) - Math.floor(ms / 1000) * 1000) / 6e4); };
// Wall-clock date and time in tz -> UTC milliseconds
export function zonedMs(tz: string, date: string, time: string): number {
  const g = dMs(date) + (+time.slice(0, 2) * 60 + +time.slice(3, 5)) * 6e4;
  let ms = g - offsetMin(tz, g) * 6e4; const o2 = offsetMin(tz, ms); if (g - o2 * 6e4 !== ms) ms = g - o2 * 6e4;
  return ms;
}
export function wallOf(tz: string, ms: number): { date: string; time: string } { const o = parts(tz, ms); return { date: `${o.year}-${o.month}-${o.day}`, time: `${p2(+o.hour % 24)}:${o.minute}` }; }

/* ================= What belongs in the calendar ================= */
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
export const KEY_RE = /^[tme]:[A-Za-z0-9_.:|-]{1,190}$/;
export function cleanWant(raw: any, from: string, to: string): Want | null {
  if (!raw || typeof raw !== "object" || typeof raw.k !== "string" || !KEY_RE.test(raw.k)) return null;
  const title = clean(raw.title, 200); if (!title || !isDate(raw.date) || raw.date < from || raw.date > to) return null;
  const allDay = !!raw.allDay || !isTime(raw.start);
  const w: Want = { k: raw.k, title, date: raw.date, allDay, where: clean(raw.where, 200), note: clean(raw.note, 300), busy: !!raw.busy };
  if (allDay) { if (isDate(raw.endDate) && raw.endDate > raw.date && raw.endDate <= addDays(raw.date, 30)) w.endDate = raw.endDate; }
  else { w.start = raw.start; w.end = isTime(raw.end) && raw.end !== raw.start ? raw.end : undefined; }
  return w;
}
// Where an event is, as compared with what the calendar has
export function spanOf(w: Want, tz: string): { s: string; e: string; sMs: number; eMs: number } {
  if (w.allDay) { const end = addDays(w.endDate || w.date, 1); return { s: "D" + w.date, e: "D" + end, sMs: dMs(w.date), eMs: dMs(end) }; }
  const sMs = zonedMs(tz, w.date, w.start!);
  let eMs = w.end ? zonedMs(tz, w.date, w.end) : sMs + 30 * 6e4;
  if (eMs <= sMs) eMs = zonedMs(tz, addDays(w.date, 1), w.end!);
  return { s: "T" + sMs, e: "T" + eMs, sMs, eMs };
}
export async function hashOf(w: Want, tz: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", enc.encode(JSON.stringify([w.title, w.where || "", w.note || "", !!w.busy, spanOf(w, tz).s, spanOf(w, tz).e])));
  return Array.from(new Uint8Array(b).slice(0, 16), x => x.toString(16).padStart(2, "0")).join("");
}
// A calendar span back to Studyboard's terms, in the person's time zone
export function wallSpan(x: Ext, tz: string): { allDay: boolean; date: string; endDate?: string; start?: string; end?: string } {
  if (x.s[0] === "D") { const d = x.s.slice(1), e = x.e[0] === "D" ? addDays(x.e.slice(1), -1) : d; return e > d ? { allDay: true, date: d, endDate: e } : { allDay: true, date: d }; }
  const a = wallOf(tz, +x.s.slice(1)), b = wallOf(tz, +x.e.slice(1));
  return { allDay: false, date: a.date, start: a.time, end: b.date === a.date ? b.time : "23:59" };
}
const spanDate = (s: string, tz: string) => s[0] === "D" ? s.slice(1) : s[0] === "T" ? wallOf(tz, +s.slice(1)).date : "";

/* ================= The plan: pure, so it can be tested without any network ================= */
export type Plan = { creates: { w: Want; h: string }[]; patches: { w: Want; h: string; r: Row }[]; deletes: Row[]; changes: any[]; rows: any[]; more: boolean; readd: Row[] };
// want: what Studyboard has now
export async function plan(want: Want[], map: Row[], ext: Map<string, Ext>, tz: string, from: string, to: string, max = MAX_WRITES): Promise<Plan> {
  const out: Plan = { creates: [], patches: [], deletes: [], changes: [], rows: [], more: false, readd: [] };
  const byKey = new Map(map.map(r => [r.sb_key, r])), wanted = new Map(want.map(w => [w.k, w])), moved = new Set<string>();
  const inWin = (r: Row) => { const d = spanDate(r.ext_start, tz); return !!d && d >= from && d <= to; };
  for (const r of map) {
    if (r.gone) continue;
    const x = ext.get(r.ext_id);
    if (!x) { if (inWin(r)) { out.changes.push({ k: r.sb_key, deleted: true }); out.rows.push({ k: r.sb_key, ext_id: r.ext_id, hash: r.hash, ext_start: r.ext_start, ext_end: r.ext_end, gone: true }); moved.add(r.sb_key); } continue; }
    if (r.ext_start && (x.s !== r.ext_start || x.e !== r.ext_end)) {
      out.changes.push({ k: r.sb_key, ...wallSpan(x, tz) });
      out.rows.push({ k: r.sb_key, ext_id: r.ext_id, hash: "", ext_start: x.s, ext_end: x.e, gone: false });
      moved.add(r.sb_key);
    }
  }
  for (const w of [...want].sort((a, b) => a.date.localeCompare(b.date))) {
    const r = byKey.get(w.k);
    if ((r && r.gone) || moved.has(w.k)) continue;
    const h = await hashOf(w, tz);
    if (!r) out.creates.push({ w, h });
    else if (r.hash === ADOPTED + h) out.rows.push({ k: r.sb_key, ext_id: r.ext_id, hash: h, ext_start: r.ext_start, ext_end: r.ext_end, gone: false });
    else if (r.hash !== h) out.patches.push({ w, h, r });
  }
  for (const r of map) if (!r.gone && !wanted.has(r.sb_key) && !moved.has(r.sb_key) && inWin(r)) {
    // A calendar event Studyboard took in that this device doesn't have yet
    if (r.hash.startsWith(ADOPTED)) out.readd.push(r); else out.deletes.push(r);
  }
  // At most max writes in one call
  let room = max;
  const take = <T,>(a: T[]) => { const t = a.slice(0, Math.max(0, room)); room -= t.length; if (t.length < a.length) out.more = true; return t; };
  out.deletes = take(out.deletes); out.patches = take(out.patches); out.creates = take(out.creates);
  return out;
}

/* ================= Events made in the Studyboard calendar itself ================= */
// The person can add an event to the Studyboard calendar in Google Calendar or Outlook
export const ADOPTED = "a:";
export type Listed = { id: string; x: Ext; title: string; where: string; ours?: boolean };
export async function adopt(it: Listed, prov: Provider, tz: string, from: string, to: string): Promise<{ ev: any; row: any } | null> {
  if (it.ours) return null;
  const sp = wallSpan(it.x, tz); if (!isDate(sp.date) || sp.date < from || sp.date > to) return null;
  const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(prov + "|new|" + it.id))).slice(0, 10), x => x.toString(16).padStart(2, "0")).join("");
  const id = "c" + prov[0] + "n" + h, title = clean(it.title, 120) || "Event", where = clean(it.where, 120);
  const ev: any = { id, title, where, date: sp.date, allDay: sp.allDay };
  if (sp.allDay) { if (sp.endDate && sp.endDate <= addDays(sp.date, 30)) ev.endDate = sp.endDate; }
  else {
    const m = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5), s0 = sp.start!, e0 = sp.end || "";
    ev.start = s0; ev.end = e0 && m(e0) > m(s0) ? e0 : (x => `${p2(Math.floor(x / 60))}:${p2(x % 60)}`)(Math.min(1439, m(s0) + 60));
  }
  const w = cleanWant({ k: "e:" + id + ":" + sp.date, title, date: sp.date, endDate: ev.endDate, allDay: ev.allDay, start: ev.start, end: ev.end, busy: !ev.allDay, where, note: "" }, from, to);
  if (!w) return null;
  return { ev, row: { k: w.k, ext_id: it.id, hash: ADOPTED + await hashOf(w, tz), ext_start: it.x.s, ext_end: it.x.e, gone: false } };
}

/* ================= Secrets: encrypted tokens and signed state ================= */
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
let KEYS: { raw: string; aes: CryptoKey; mac: CryptoKey } | null = null;
export async function keys(secret: string) {
  if (KEYS && KEYS.raw === secret) return KEYS;
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), "HKDF", false, ["deriveKey"]);
  const hk = (info: string) => ({ name: "HKDF", hash: "SHA-256", salt: enc.encode("studyboard-calsync-v1"), info: enc.encode(info) });
  const aes = await crypto.subtle.deriveKey(hk("tokens"), base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const mac = await crypto.subtle.deriveKey(hk("state"), base, { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign", "verify"]);
  KEYS = { raw: secret, aes, mac };
  return KEYS;
}
// The token is bound to its owner and provider
export async function seal(secret: string, text: string, uid: string, provider: string): Promise<string> {
  const k = await keys(secret), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(uid + "|" + provider) }, k.aes, enc.encode(text));
  return "v1." + b64u(iv) + "." + b64u(ct);
}
export async function unseal(secret: string, box: string, uid: string, provider: string): Promise<string> {
  const [v, iv, ct] = String(box).split("."); if (v !== "v1" || !iv || !ct) throw new Error("bad box");
  const k = await keys(secret);
  return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv), additionalData: enc.encode(uid + "|" + provider) }, k.aes, unb64u(ct)));
}
export async function signState(secret: string, o: { u: string; p: string; e: number; z?: string }): Promise<string> {
  const body = b64u(enc.encode(JSON.stringify({ ...o, n: b64u(crypto.getRandomValues(new Uint8Array(9))) })));
  return body + "." + b64u(await crypto.subtle.sign("HMAC", (await keys(secret)).mac, enc.encode(body)));
}
export async function readState(secret: string, s: string, nowMs: number): Promise<{ u: string; p: Provider; z: string; n: string } | null> {
  const [body, sig] = String(s || "").split("."); if (!body || !sig || body.length > 600) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", (await keys(secret)).mac, unb64u(sig), enc.encode(body)))) return null;
    const o = JSON.parse(dec.decode(unb64u(body)));
    if (!o || typeof o.u !== "string" || !/^[0-9a-f-]{36}$/.test(o.u) || !PROVIDERS.includes(o.p) || !(o.e > nowMs / 1000)) return null;
    if (typeof o.n !== "string" || !/^[A-Za-z0-9_-]{8,20}$/.test(o.n)) return null;
    return { u: o.u, p: o.p, z: validTz(o.z) ? o.z : "UTC", n: o.n };
  } catch (_e) { return null; }
}

/* ================= Google and Microsoft ================= */
class ProviderError extends Error { status: number; reauth: boolean; constructor(status: number, reauth = false, msg = "") { super(msg || "provider " + status); this.status = status; this.reauth = reauth; } }
type Adapter = {
  configured(): boolean; authUrl(state: string, redirect: string): string;
  exchange(code: string, redirect: string): Promise<{ refresh: string; access: string; account: string }>;
  refresh(rt: string): Promise<{ access: string; refresh?: string }>;
  ensureCalendar(at: string, id: string | null, tz: string): Promise<{ id: string; made: boolean }>;
  list(at: string, cal: string, fromMs: number, toMs: number, busyOnly: boolean): Promise<Listed[]>;
  create(at: string, cal: string, w: Want, tz: string): Promise<string>;
  patch(at: string, cal: string, id: string, w: Want, tz: string): Promise<boolean>;
  remove(at: string, cal: string, id: string): Promise<void>;
  getOne(at: string, cal: string, id: string): Promise<Ext | null>;
  removeCalendar(at: string, cal: string): Promise<void>;
  revoke(rt: string): Promise<void>;
};
async function api(d: Deps, url: string, at: string, init: RequestInit = {}, okMissing = false): Promise<any> {
  const r = await d.fetch(url, { ...init, headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  if (okMissing && (r.status === 404 || r.status === 410)) return null;
  if (!r.ok) throw new ProviderError(r.status, r.status === 401);
  return r.status === 204 ? {} : await r.json().catch(() => ({}));
}
async function tokenCall(d: Deps, url: string, form: Record<string, string>): Promise<any> {
  const r = await d.fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form).toString() });
  const j = await r.json().catch(() => ({})) as any;
  if (!r.ok) throw new ProviderError(r.status, j && (j.error === "invalid_grant" || j.error === "interaction_required" || j.error === "consent_required"));
  return j;
}
const jwtEmail = (t: string) => { try { return String(JSON.parse(dec.decode(unb64u(t.split(".")[1]))).email || ""); } catch (_e) { return ""; } };
const DESC = (w: Want) => [w.note, "From Studyboard. Change it in Studyboard, or move it here and Studyboard follows."].filter(Boolean).join("\n");

export function google(d: Deps): Adapter {
  const id = d.env("GOOGLE_CLIENT_ID"), secret = d.env("GOOGLE_CLIENT_SECRET"), G = "https://www.googleapis.com/calendar/v3";
  const time = (w: Want, tz: string, end: boolean) => { const sp = spanOf(w, tz); return w.allDay ? { date: (end ? sp.e : sp.s).slice(1) } : { dateTime: new Date(end ? sp.eMs : sp.sMs).toISOString(), timeZone: tz }; };
  const body = (w: Want, tz: string) => ({ summary: w.title, location: w.where || undefined, description: DESC(w), start: time(w, tz, false), end: time(w, tz, true),
    transparency: w.busy ? "opaque" : "transparent", reminders: { useDefault: false, overrides: [] }, extendedProperties: { private: { sbk: w.k } } });
  const norm = (it: any): Ext | null => it.start && it.start.date ? { s: "D" + it.start.date, e: "D" + (it.end && it.end.date || addDays(it.start.date, 1)) }
    : it.start && it.start.dateTime ? { s: "T" + Date.parse(it.start.dateTime), e: "T" + Date.parse(it.end && it.end.dateTime || it.start.dateTime) } : null;
  return {
    configured: () => !!id && !!secret,
    authUrl: (state, redirect) => "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({ client_id: id, redirect_uri: redirect, response_type: "code", access_type: "offline", prompt: "consent", include_granted_scopes: "true", state,
      scope: "openid email https://www.googleapis.com/auth/calendar.app.created" + (googleReads(d) ? " https://www.googleapis.com/auth/calendar.events.readonly" : "") }).toString(),
    async exchange(code, redirect) {
      const j = await tokenCall(d, "https://oauth2.googleapis.com/token", { code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code" });
      if (!j.refresh_token || !j.access_token) throw new ProviderError(400, false, "no refresh token");
      return { refresh: j.refresh_token, access: j.access_token, account: jwtEmail(j.id_token || "") };
    },
    async refresh(rt) { const j = await tokenCall(d, "https://oauth2.googleapis.com/token", { refresh_token: rt, client_id: id, client_secret: secret, grant_type: "refresh_token" }); return { access: j.access_token }; },
    async ensureCalendar(at, cal, tz) {
      if (cal && await api(d, `${G}/calendars/${encodeURIComponent(cal)}`, at, {}, true)) return { id: cal, made: false };
      const c = await api(d, `${G}/calendars`, at, { method: "POST", body: JSON.stringify({ summary: "Studyboard", description: "Deadlines, exams, classes and study sessions from Studyboard.", timeZone: tz }) });
      return { id: c.id, made: true };
    },
    async list(at, cal, fromMs, toMs, busyOnly) {
      const out: any[] = []; let page = "";
      for (let i = 0; i < 6; i++) {
        const q = new URLSearchParams({ timeMin: new Date(fromMs).toISOString(), timeMax: new Date(toMs).toISOString(), singleEvents: "true", showDeleted: "false", maxResults: "2500",
          fields: "items(id,status,start,end,summary,location,transparency,eventType,extendedProperties),nextPageToken", ...(page ? { pageToken: page } : {}) });
        const j = await api(d, `${G}/calendars/${encodeURIComponent(cal)}/events?${q}`, at);
        for (const it of j.items || []) {
          if (it.status === "cancelled") continue;
          if (busyOnly && (it.transparency === "transparent" || it.eventType === "workingLocation")) continue;
          const x = norm(it); if (x) out.push({ id: String(it.id), x, title: String(it.summary || ""), where: String(it.location || ""), ours: !!(it.extendedProperties && it.extendedProperties.private && it.extendedProperties.private.sbk) });
        }
        page = j.nextPageToken || ""; if (!page) break;
      }
      return out;
    },
    async create(at, cal, w, tz) { return String((await api(d, `${G}/calendars/${encodeURIComponent(cal)}/events`, at, { method: "POST", body: JSON.stringify(body(w, tz)) })).id); },
    async patch(at, cal, eid, w, tz) { return !!(await api(d, `${G}/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(eid)}`, at, { method: "PUT", body: JSON.stringify(body(w, tz)) }, true)); },
    async remove(at, cal, eid) { await api(d, `${G}/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(eid)}`, at, { method: "DELETE" }, true); },
    async getOne(at, cal, eid) { const it = await api(d, `${G}/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(eid)}`, at, {}, true); return it && it.status !== "cancelled" ? norm(it) : null; },
    async removeCalendar(at, cal) { await api(d, `${G}/calendars/${encodeURIComponent(cal)}`, at, { method: "DELETE" }, true); },
    async revoke(rt) { try { await d.fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(rt), { method: "POST" }); } catch (_e) { } },
  };
}

export function microsoft(d: Deps): Adapter {
  const id = d.env("MS_CLIENT_ID"), secret = d.env("MS_CLIENT_SECRET"), M = "https://graph.microsoft.com/v1.0", T = "https://login.microsoftonline.com/common/oauth2/v2.0";
  const SCOPE = "offline_access openid email User.Read Calendars.ReadWrite";
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19);
  const body = (w: Want, tz: string) => { const sp = spanOf(w, tz);
    return { subject: w.title, body: { contentType: "text", content: DESC(w) }, location: { displayName: w.where || "" }, isAllDay: w.allDay, showAs: w.busy ? "busy" : "free", isReminderOn: false,
      start: { dateTime: w.allDay ? sp.s.slice(1) + "T00:00:00" : iso(sp.sMs), timeZone: "UTC" }, end: { dateTime: w.allDay ? sp.e.slice(1) + "T00:00:00" : iso(sp.eMs), timeZone: "UTC" } }; };
  const norm = (it: any): Ext | null => {
    if (!it.start || !it.start.dateTime) return null;
    if (it.isAllDay) return { s: "D" + it.start.dateTime.slice(0, 10), e: "D" + String(it.end && it.end.dateTime || it.start.dateTime).slice(0, 10) };
    return { s: "T" + Date.parse(it.start.dateTime.slice(0, 19) + "Z"), e: "T" + Date.parse(String(it.end && it.end.dateTime || it.start.dateTime).slice(0, 19) + "Z") };
  };
  return {
    configured: () => !!id && !!secret,
    authUrl: (state, redirect) => `${T}/authorize?` + new URLSearchParams({ client_id: id, response_type: "code", redirect_uri: redirect, response_mode: "query", scope: SCOPE, state, prompt: "select_account" }).toString(),
    async exchange(code, redirect) {
      const j = await tokenCall(d, `${T}/token`, { client_id: id, client_secret: secret, code, redirect_uri: redirect, grant_type: "authorization_code", scope: SCOPE });
      if (!j.refresh_token || !j.access_token) throw new ProviderError(400, false, "no refresh token");
      let account = jwtEmail(j.id_token || "");
      if (!account) { try { const me = await api(d, `${M}/me?$select=mail,userPrincipalName`, j.access_token); account = String(me.mail || me.userPrincipalName || ""); } catch (_e) { } }
      return { refresh: j.refresh_token, access: j.access_token, account };
    },
    async refresh(rt) { const j = await tokenCall(d, `${T}/token`, { client_id: id, client_secret: secret, refresh_token: rt, grant_type: "refresh_token", scope: SCOPE }); return { access: j.access_token, refresh: j.refresh_token }; },
    async ensureCalendar(at, cal) {
      if (cal && await api(d, `${M}/me/calendars/${encodeURIComponent(cal)}?$select=id`, at, {}, true)) return { id: cal, made: false };
      for (const name of ["Studyboard", "Studyboard Sync", "Studyboard (two-way)"]) {
        const r = await d.fetch(`${M}/me/calendars`, { method: "POST", headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
        if (r.ok) return { id: String((await r.json() as any).id), made: true };
        if (r.status !== 409) throw new ProviderError(r.status, r.status === 401);
      }
      throw new ProviderError(409);
    },
    async list(at, cal, fromMs, toMs, busyOnly) {
      const out: any[] = [];
      let url = `${cal === "primary" ? `${M}/me/calendar` : `${M}/me/calendars/${encodeURIComponent(cal)}`}/calendarView?` + new URLSearchParams({ startDateTime: new Date(fromMs).toISOString(), endDateTime: new Date(toMs).toISOString(), $top: "500",
        $select: "id,subject,start,end,isAllDay,showAs,isCancelled,location,bodyPreview" }).toString();
      for (let i = 0; i < 6 && url; i++) {
        const j = await api(d, url, at, { headers: { Prefer: 'outlook.timezone="UTC"' } });
        for (const it of j.value || []) {
          if (it.isCancelled) continue;
          if (busyOnly && (it.showAs === "free" || it.showAs === "workingElsewhere")) continue;
          const x = norm(it); if (x) out.push({ id: String(it.id), x, title: String(it.subject || ""), where: String(it.location && it.location.displayName || ""), ours: /From Studyboard\. Change it in Studyboard/.test(String(it.bodyPreview || "")) });
        }
        url = j["@odata.nextLink"] || "";
      }
      return out;
    },
    async create(at, cal, w, tz) { return String((await api(d, `${M}/me/calendars/${encodeURIComponent(cal)}/events`, at, { method: "POST", body: JSON.stringify(body(w, tz)) })).id); },
    async patch(at, _cal, eid, w, tz) { return !!(await api(d, `${M}/me/events/${encodeURIComponent(eid)}`, at, { method: "PATCH", body: JSON.stringify(body(w, tz)) }, true)); },
    async remove(at, _cal, eid) { await api(d, `${M}/me/events/${encodeURIComponent(eid)}`, at, { method: "DELETE" }, true); },
    async getOne(at, _cal, eid) { const it = await api(d, `${M}/me/events/${encodeURIComponent(eid)}?$select=id,start,end,isAllDay,isCancelled`, at, { headers: { Prefer: 'outlook.timezone="UTC"' } }, true); return it && !it.isCancelled ? norm(it) : null; },
    async removeCalendar(at, cal) { await api(d, `${M}/me/calendars/${encodeURIComponent(cal)}`, at, { method: "DELETE" }, true); },
    async revoke() { },
  };
}

/* ================= The function ================= */
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600",
};
const reply = (o: unknown, status: number) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");
const redirectOf = (d: Deps) => d.env("CALSYNC_REDIRECT") || `${base(d)}/functions/v1/calendar-sync`;
async function rpc(d: Deps, name: string, args: Record<string, unknown>): Promise<any> {
  const k = serviceKey(d);
  const r = await d.fetch(`${base(d)}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`db ${name} ${r.status}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function whoIs(d: Deps, token: string): Promise<string | null> {
  if (!token) return null;
  const r = await d.fetch(`${base(d)}/auth/v1/user`, { headers: { apikey: d.env("SUPABASE_ANON_KEY") || serviceKey(d), Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null) as { id?: string } | null;
  return u?.id && /^[0-9a-f-]{36}$/i.test(u.id) ? u.id.toLowerCase() : null;
}
export const adapters = (d: Deps): Record<Provider, Adapter> => ({ google: google(d), microsoft: microsoft(d) });
const page = (title: string, text: string, ok: boolean) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E2A56;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0E2A56}main{background:#fff;border-radius:18px;padding:28px 26px;max-width:420px;margin:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}b{display:block;font-size:1.25rem;margin:8px 0}i{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:50%;background:${ok ? "#2E9E6B" : "#C93439"};color:#fff;font-style:normal;font-size:1.6rem}p{margin:6px 0 0;color:#40506B}</style></head>
<body><main><i>${ok ? "✓" : "!"}</i><b>${title}</b><p>${text}</p></main></body></html>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "X-Studyboard-Page": "html", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'", "Referrer-Policy": "no-referrer" } });
const NAME: Record<Provider, string> = { google: "Google Calendar", microsoft: "Outlook" };

/* Connecting is bound to the browser that started it, and confirmed by the person */
const COOKIE = "sbcs";
const cookieOf = (req: Request) => ((req.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "=")) || "").slice(COOKIE.length + 1);
const setCookie = (v: string, age: number) => `${COOKIE}=${v}; Max-Age=${age}; Path=/functions/v1/calendar-sync; HttpOnly; Secure; SameSite=Lax`;
const htmlEsc = (s: string) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]);
async function studyboardEmail(d: Deps, uid: string): Promise<string> {
  try { const k = serviceKey(d); const r = await d.fetch(`${base(d)}/auth/v1/admin/users/${uid}`, { headers: { apikey: k, Authorization: `Bearer ${k}` } }); const u = await r.json() as any; return String(u && u.email || ""); } catch (_e) { return ""; }
}
async function begin(req: Request, url: URL, d: Deps, A: Record<Provider, Adapter>, log: (o: string, x?: any) => void): Promise<Response> {
  const secret = d.env("CALSYNC_KEY"), raw = url.searchParams.get("begin") || "";
  const st = secret.length >= 32 ? await readState(secret, raw, d.now()) : null;
  if (!st || !A[st.p].configured()) { log("begin_bad"); return page("That link has expired", "Go back to Studyboard and choose Connect again.", false); }
  // When the return address is on the website (CLOUD_REDIRECT / CALSYNC_REDIRECT)
  if (new URL(redirectOf(d)).host !== new URL(base(d)).host && req.headers.get("x-studyboard-via") !== "site") {
    log("begin_to_site");
    return new Response(null, { status: 302, headers: { Location: `${redirectOf(d)}?begin=${encodeURIComponent(raw)}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }
  return new Response(null, { status: 302, headers: { Location: A[st.p].authUrl(raw, redirectOf(d)), "Set-Cookie": setCookie(st.n, 900), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
async function callback(req: Request, url: URL, d: Deps, A: Record<Provider, Adapter>, log: (o: string, x?: any) => void): Promise<Response> {
  const secret = d.env("CALSYNC_KEY");
  const st = secret.length >= 32 ? await readState(secret, url.searchParams.get("state") || "", d.now()) : null;
  if (!st) { log("cb_bad_state"); return page("That link has expired", "Go back to Studyboard and choose Connect again.", false); }
  if (cookieOf(req) !== st.n) { log("cb_other_browser"); return page("Start again in Studyboard", "This connection wasn't started in this browser, so nothing was connected. Choose Connect in your own Studyboard.", false); }
  if (url.searchParams.get("error")) { log("cb_denied"); return page("Not connected", `Access wasn't allowed, so nothing changed. You can try again from Studyboard.`, false); }
  const code = url.searchParams.get("code") || ""; if (!code || code.length > 2000) return page("Not connected", "Something was missing. Try again from Studyboard.", false);
  const P = A[st.p];
  try {
    const t = await P.exchange(code, redirectOf(d));
    const box = await seal(secret, JSON.stringify({ u: st.u, p: st.p, z: st.z, n: st.n, rt: t.refresh, a: t.account.slice(0, 200), e: Math.floor(d.now() / 1000) + 600 }), "confirm", "calsync");
    const sb = await studyboardEmail(d, st.u);
    log("cb_confirm", { provider: st.p });
    return confirmPage(`Connect ${NAME[st.p]}?`, `Connect <b>${htmlEsc(t.account || NAME[st.p])}</b> to the Studyboard account <b>${htmlEsc(sb || "(no email address)")}</b>? Studyboard will keep a calendar called “Studyboard” there.<br><br><b>Only continue if this is your Studyboard account.</b> If someone sent you this link, close this page.`, box);
  } catch (e) {
    log("cb_error", { provider: st.p, status: e instanceof ProviderError ? e.status : 0 });
    return page("Not connected", `${NAME[st.p]} didn't finish connecting. Try again from Studyboard.`, false);
  }
}
const confirmPage = (title: string, html: string, box: string) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E2A56;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0E2A56}main{background:#fff;border-radius:18px;padding:28px 26px;max-width:440px;margin:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}h1{font-size:1.25rem;margin:0 0 8px}p{margin:0 0 18px;color:#40506B}button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:12px 22px;background:#2563EB;color:#fff;cursor:pointer}</style></head>
<body><main><h1>${title}</h1><p>${html}</p><form method="post"><input type="hidden" name="confirm" value="${htmlEsc(box)}"><button type="submit">Connect</button></form></main></body></html>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "X-Studyboard-Page": "html", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY" } });
async function confirm(req: Request, d: Deps, A: Record<Provider, Adapter>, log: (o: string, x?: any) => void): Promise<Response> {
  const secret = d.env("CALSYNC_KEY"), text = await readLimited(req, 9000);
  if (secret.length < 32 || text === null) return page("Not connected", "Try again from Studyboard.", false);
  let o: any = null;
  try { o = JSON.parse(await unseal(secret, new URLSearchParams(text).get("confirm") || "", "confirm", "calsync")); } catch (_e) { o = null; }
  if (!o || !PROVIDERS.includes(o.p) || !(o.e > d.now() / 1000) || cookieOf(req) !== o.n) { log("confirm_bad"); return page("That page has expired", "Go back to Studyboard and choose Connect again.", false); }
  const prov: Provider = o.p, P = A[prov];
  try {
    const tok = await P.refresh(o.rt), cur = (await rpc(d, "calsync_account", { p_uid: o.u, p_provider: prov }) || [])[0];
    const cal = await P.ensureCalendar(tok.access, cur && cur.cal_id || null, validTz(o.z) ? o.z : "UTC");
    await rpc(d, "calsync_connect", { p_uid: o.u, p_provider: prov, p_account: String(o.a || ""), p_refresh_enc: await seal(secret, tok.refresh || o.rt, o.u, prov), p_cal_id: cal.id });
    log("cb_connected", { provider: prov, made: cal.made });
    const r = page(`Connected to ${NAME[prov]}`, `Studyboard made a calendar called “Studyboard” in ${htmlEsc(o.a || "your account")}. You can close this tab and go back to Studyboard.`, true);
    r.headers.set("Set-Cookie", setCookie("", 0));
    return r;
  } catch (e) {
    log("confirm_error", { provider: prov, status: e instanceof ProviderError ? e.status : 0 });
    return page("Not connected", `${NAME[prov]} didn't finish connecting. Try again from Studyboard.`, false);
  }
}

// Reads the body but stops as soon as it passes max bytes (null = too big)
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
  return dec.decode(all);
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) { let i = 0; await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const x = items[i++]; await fn(x); } })); }

async function sync(uid: string, b: any, d: Deps, A: Record<Provider, Adapter>, log: (o: string, x?: any) => void): Promise<Response> {
  const prov: Provider = b.provider, P = A[prov], secret = d.env("CALSYNC_KEY");
  const tz = validTz(b.tz) ? b.tz : "UTC", today = wallOf(tz, d.now()).date;
  const from = isDate(b.from) && b.from >= addDays(today, -31) ? b.from : addDays(today, -7), to = isDate(b.to) && b.to <= addDays(today, 180) && b.to > from ? b.to : addDays(today, 60);
  const raw = Array.isArray(b.events) ? b.events : [];
  if (raw.length > MAX_EVENTS) return reply({ error: "bad request", message: `At most ${MAX_EVENTS} events in one sync.` }, 400);
  const seen = new Set<string>(), want: Want[] = [];
  for (const e of raw) { const w = cleanWant(e, from, to); if (w && !seen.has(w.k)) { seen.add(w.k); want.push(w); } }
  const acct = (await rpc(d, "calsync_account", { p_uid: uid, p_provider: prov }) || [])[0];
  if (!acct) return reply({ error: "not_connected" }, 404);
  if (acct.status === "reauth") return reply({ error: "reauth" }, 409);
  if (!(await rpc(d, "calsync_lock", { p_uid: uid, p_provider: prov, p_secs: 120 }))) return reply({ error: "busy" }, 409);
  let synced = false;
  try {
    let rt: string;
    try { rt = await unseal(secret, acct.refresh_enc, uid, prov); } catch (_e) { await rpc(d, "calsync_update", { p_uid: uid, p_provider: prov, p_status: "reauth" }); return reply({ error: "reauth" }, 409); }
    let tok: { access: string; refresh?: string };
    try { tok = await P.refresh(rt); }
    catch (e) { if (e instanceof ProviderError && e.reauth) { await rpc(d, "calsync_update", { p_uid: uid, p_provider: prov, p_status: "reauth" }); return reply({ error: "reauth" }, 409); } throw e; }
    if (tok.refresh && tok.refresh !== rt) await rpc(d, "calsync_update", { p_uid: uid, p_provider: prov, p_refresh_enc: await seal(secret, tok.refresh, uid, prov) });
    const at = tok.access;
    const cal = await P.ensureCalendar(at, acct.cal_id || null, tz);
    if (cal.id !== acct.cal_id) await rpc(d, "calsync_update", { p_uid: uid, p_provider: prov, p_cal_id: cal.id });
    const map: Row[] = cal.made ? [] : (await rpc(d, "calsync_map_get", { p_uid: uid, p_provider: prov }) || []);
    const fromMs = zonedMs(tz, addDays(from, -1), "00:00"), toMs = zonedMs(tz, addDays(to, 2), "00:00");
    const listed = await P.list(at, cal.id, fromMs, toMs, false);
    const ext = new Map<string, Ext>(listed.map(x => [x.id, x.x]));
    // An event the person moved far outside the window isn't in the list
    const inWin = (r: Row) => { const dd = spanDate(r.ext_start, tz); return !!dd && dd >= from && dd <= to; };
    const missing = map.filter(r => !r.gone && inWin(r) && !ext.has(r.ext_id)).slice(0, 40);
    await pool(missing, POOL, async r => { try { const x = await P.getOne(at, cal.id, r.ext_id); if (x) ext.set(r.ext_id, x); } catch (_e) { ext.set(r.ext_id, { s: r.ext_start, e: r.ext_end }); } });
    // Rows for things long past are forgotten (the events stay in the calendar)
    const wantedKeys = new Set(want.map(w => w.k));
    const old = map.filter(r => { const dd = spanDate(r.ext_start, tz); return !wantedKeys.has(r.sb_key) && !!dd && dd < addDays(from, -30); }).map(r => r.sb_key);
    const live = map.filter(r => !old.includes(r.sb_key));
    const pl = await plan(want, live, ext, tz, from, to, Math.max(0, Math.min(MAX_WRITES, 5500 - live.length)));
    const rows = pl.rows.slice(), drop: string[] = old.slice(), stats = { created: 0, updated: 0, removed: 0, moved: pl.changes.filter(c => !c.deleted).length, deleted: pl.changes.filter(c => c.deleted).length, failed: 0 };
    const fail = (e: unknown) => { stats.failed++; if (e instanceof ProviderError && (e.status === 429 || e.status === 403)) pl.more = true; };
    await pool(pl.deletes, POOL, async r => { try { await P.remove(at, cal.id, r.ext_id); drop.push(r.sb_key); stats.removed++; } catch (e) { fail(e); } });
    await pool(pl.patches, POOL, async p => {
      try {
        const sp = spanOf(p.w, tz); let eid = p.r.ext_id;
        if (!(await P.patch(at, cal.id, eid, p.w, tz))) eid = await P.create(at, cal.id, p.w, tz);
        rows.push({ k: p.w.k, ext_id: eid, hash: p.h, ext_start: sp.s, ext_end: sp.e, gone: false }); stats.updated++;
      } catch (e) { fail(e); }
    });
    await pool(pl.creates, POOL, async c => {
      try { const sp = spanOf(c.w, tz), eid = await P.create(at, cal.id, c.w, tz); rows.push({ k: c.w.k, ext_id: eid, hash: c.h, ext_start: sp.s, ext_end: sp.e, gone: false }); stats.created++; }
      catch (e) { fail(e); }
    });
    // Events the person added to the Studyboard calendar themselves
    const added: any[] = [], known = new Set(map.map(r => r.ext_id)), byExt = new Map(listed.map(i => [i.id, i]));
    for (const it of listed) {
      if (known.has(it.id) || added.length >= 100) continue;
      const a = await adopt(it, prov, tz, from, to); if (!a) continue;
      added.push(a.ev); rows.push(a.row); known.add(it.id);
    }
    for (const r of pl.readd) { const it = byExt.get(r.ext_id); const a = it ? await adopt(it, prov, tz, from, to) : null; if (a && a.row.k === r.sb_key) added.push(a.ev); }
    if (rows.length || drop.length) await rpc(d, "calsync_map_save", { p_uid: uid, p_provider: prov, p_rows: rows, p_drop: drop });
    // Busy times from the person's own calendar, for Today's Plan
    let busy: any[] | null = null, busyErr = "";
    if (prov === "google" && !googleReads(d)) busy = [];
    else if (b.bring === "titles" || b.bring === "busy") {
      const bf = zonedMs(tz, today, "00:00"), bt = zonedMs(tz, addDays(today, BUSY_DAYS), "00:00");
      let items: Listed[] = [];
      try { items = (await P.list(at, "primary", bf, bt, b.bring === "busy")).slice(0, MAX_BUSY); }
      catch (e) { if (e instanceof ProviderError && (e.status === 403 || e.status === 401)) busyErr = "no_access"; else throw e; }
      busy = busyErr ? null : [];
      if (busy) for (const it of items) {
        const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(prov + "|" + it.id))).slice(0, 10), x => x.toString(16).padStart(2, "0")).join("");
        busy.push({ id: h, title: b.bring === "titles" ? clean(it.title, 120) || "Busy" : "Busy", where: b.bring === "titles" ? clean(it.where, 120) : "", ...wallSpan(it.x, tz) });
      }
    }
    synced = stats.failed === 0;
    log("synced", { provider: prov, n: want.length, ...stats, added: added.length, more: pl.more });
    return reply({ ok: true, changes: pl.changes, added, busy, busyErr, more: pl.more || stats.failed > 0, stats, window: { from, to }, busyWindow: busy ? { from: today, to: addDays(today, BUSY_DAYS - 1) } : null }, 200);
  } finally {
    try { await rpc(d, "calsync_unlock", { p_uid: uid, p_provider: prov, p_synced: synced }); } catch (_e) { }
  }
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const t0 = d.now(), url = new URL(req.url);
  const log = (outcome: string, extra: Record<string, unknown> = {}) => d.log(JSON.stringify({ fn: "calendar-sync", outcome, ms: d.now() - t0, ...extra }));
  const A = adapters(d);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET" && url.searchParams.has("begin")) return begin(req, url, d, A, log);
  if (req.method === "GET" && (url.searchParams.has("state") || url.searchParams.has("code") || url.searchParams.has("error"))) return callback(req, url, d, A, log);
  if (req.method !== "POST") return reply({ error: "method not allowed" }, 405);
  if ((req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded") && !req.headers.get("authorization")) return confirm(req, d, A, log);
  const secret = d.env("CALSYNC_KEY");
  if (secret.length < 32) { log("not_configured"); return reply({ error: "not_configured" }, 501); }
  try {
    const uid = await whoIs(d, (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim());
    if (!uid) return reply({ error: "sign in first" }, 401);
    const text = await readLimited(req, 1_200_000);
    if (text === null || text.length > 400_000) return reply({ error: "bad request" }, 400);
    let b: any; try { b = JSON.parse(text || "{}"); } catch (_e) { b = null; }
    if (!b || typeof b !== "object") return reply({ error: "bad request" }, 400);
    const providers = { google: A.google.configured(), microsoft: A.microsoft.configured() };
    if (b.action === "status") return reply({ accounts: await rpc(d, "calsync_status", { p_uid: uid }) || [], providers, reads: { google: googleReads(d), microsoft: true } }, 200);
    if (!PROVIDERS.includes(b.provider)) return reply({ error: "bad request" }, 400);
    const prov: Provider = b.provider;
    if (b.action === "disconnect") {
      const acct = (await rpc(d, "calsync_account", { p_uid: uid, p_provider: prov }) || [])[0];
      if (acct) {
        try {
          const rt = await unseal(secret, acct.refresh_enc, uid, prov);
          if (b.remove && acct.cal_id) { const tok = await A[prov].refresh(rt); await A[prov].removeCalendar(tok.access, acct.cal_id); }
          await A[prov].revoke(rt);
        } catch (_e) { }
        await rpc(d, "calsync_disconnect", { p_uid: uid, p_provider: prov });
      }
      log("disconnected", { provider: prov });
      return reply({ ok: true }, 200);
    }
    if (!(await rpc(d, "calsync_allowed", { p_uid: uid }))) return reply({ error: "pro_required" }, 402);
    if (!A[prov].configured()) return reply({ error: "not_configured", provider: prov }, 501);
    if (b.action === "start") {
      const state = await signState(secret, { u: uid, p: prov, e: Math.floor(d.now() / 1000) + 900, z: validTz(b.tz) ? b.tz : "UTC" });
      log("start", { provider: prov });
      return reply({ url: `${redirectOf(d)}?begin=${encodeURIComponent(state)}` }, 200);
    }
    if (b.action === "sync") return await sync(uid, b, d, A, log);
    return reply({ error: "bad request" }, 400);
  } catch (e) {
    log("error", { msg: e instanceof Error ? e.message.slice(0, 80) : "error", status: e instanceof ProviderError ? e.status : undefined });
    return reply({ error: e instanceof ProviderError ? "provider" : "server error" }, e instanceof ProviderError ? 502 : 500);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
