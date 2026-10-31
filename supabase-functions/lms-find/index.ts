// Studyboard: the address of a school's Brightspace, Canvas or Blackboard site, for "Find your school" in the app.
//
// POST /lms-find {key: "<school key from search_schools>", lms: "brightspace" | "canvas" | "blackboard"}
//   -> {host: "learn.bcit.ca"} or {host: ""} when none was found
//
// The schools list has each school's own web domain, not its school site, so this tries the addresses schools usually use
// (the school's own first, e.g. learn.bcit.ca, then the provider's, e.g. bcit.brightspace.com), checks which is really that
// kind of site, and remembers the answer for 30 days (a miss for a day) in school_lms. A school's own address comes first
// because a school's sign-in often only works through it (bcit.brightspace.com exists, but BCIT signs in at learn.bcit.ca).
// High schools: the school board or district runs the site, so this uses the district's domains (supabase-lms-districts.sql:
// Ontario boards, BC districts, US public school districts) and the address boards share in Ontario and BC, and remembers
// the answer for the whole district. District initials repeat (lcps.org, lcps.k12.nm.us), so a provider address named after
// a short or shared name (lcps.instructure.com) counts only when its sign-in points back to the district's own domain.
// No sign-in needed; a few lookups a minute per visitor. supabase-schools.sql, supabase-lms-find.sql, supabase-lms-districts.sql.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };
type Lms = "brightspace" | "canvas" | "blackboard";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
const HIT_DAYS = 30, MISS_DAYS = 1, PROBE_MS = 4500, AT_ONCE = 6;
const HOST = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");

// The addresses to try, best first: the school's own, then the provider's
// The district-level domain of a web address: elite.guhsd.net -> guhsd.net, www.isd535.k12.mn.us -> isd535.k12.mn.us
const SHARED = /^(k12\.[a-z]{2}\.us|[a-z]{2}\.us|wednet\.edu|(edu\.)?(on|bc|ab|qc|ns|nb|mb|sk|pe|nl|nt|yk|nu)\.ca|(co|ac|edu|sch|org|gov|net|k12)\.[a-z]{2}|[a-z]{2,3})$/;
const HOSTING = /(^|\.)(google\.com|facebook\.com|weebly\.com|wixsite\.com|wordpress\.com|blogspot\.com|squarespace\.com|schoolloop\.com|schoolinsites\.com|schoolwires\.(net|com)|finalsite\.(net|com)|edlio(school|cloud)?\.com|apptegy\.net|thrillshare\.com|myschoolapp\.com|sharpschool\.(com|net)|campussuite\.com|socs\.net|responsiveed\.com)$/;
export function siteDomain(v: string): string {
  let h = String(v || "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").split(/[/:?#]/)[0].replace(/\.$/, "").replace(/^www\d?\./, "");
  if (!HOST.test(h) || HOSTING.test(h)) return "";
  const l = h.split(".");
  for (let i = 0; i < l.length - 1; i++) if (SHARED.test(l.slice(i + 1).join("."))) return l.slice(i).join(".");
  return h;
}

export function candidates(lms: Lms, domains: string[]): string[] {
  const doms = [...new Set(domains.map(x => String(x || "").toLowerCase().replace(/^www\./, "")).filter(x => HOST.test(x)))].slice(0, 4);
  const slugs = [...new Set(doms.map(x => x.split(".")[0]).filter(x => x.length >= 2))];
  const own = (subs: string[]) => doms.flatMap(dm => subs.map(s => `${s}.${dm}`));
  const out = lms === "brightspace" ? [...own(["learn", "d2l", "brightspace", "elearning", "mycourses", "courses", "lms", "online"]), ...slugs.flatMap(s => [`${s}.brightspace.com`, `${s}.desire2learn.com`])]
    : lms === "canvas" ? [...own(["canvas", "learn", "courses", "lms"]), ...slugs.map(s => `${s}.instructure.com`)]
    : [...own(["blackboard", "bb", "learn", "mycourses", "courses", "elearning"]), ...slugs.map(s => `${s}.blackboard.com`)];
  return [...new Set(out)].filter(h => HOST.test(h));
}

// Is this host really that kind of site? Returns the host to use (the one a provider address forwards to), or "".
const PATH: Record<Lms, string> = { brightspace: "/d2l/login", canvas: "/login/canvas", blackboard: "/webapps/login/" };
const MARK: Record<Lms, RegExp> = { brightspace: /d2l|brightspace|desire2learn/i, canvas: /instructure|canvas/i, blackboard: /blackboard|bb-|\/webapps\/|learn\.ultra|anthology/i };
const SSO = /(^|\.)(microsoftonline\.com|login\.microsoft\.com|accounts\.google\.com|okta\.com|onelogin\.com|duosecurity\.com|shibboleth|cas\.|sso\.|idp\.|auth\.|login\.)/i;
// need: for a provider address, the school's own domains, one of which the redirects or the page must mention
export async function probe(d: Deps, lms: Lms, host: string, need: string[] = []): Promise<string> {
  let url = `https://${host}${PATH[lms]}`, cur = host, seenMark = false, seen = "";
  const owns = (t: string) => !need.length || need.some(x => t.includes(x));
  for (let hop = 0; hop < 6; hop++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), PROBE_MS);
    try {
      const r = await d.fetch(url, { redirect: "manual", signal: ctl.signal, headers: { "User-Agent": "Mozilla/5.0 (Studyboard school finder)", Accept: "text/html" } });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location"); if (!loc) return "";
        const next = new URL(loc, url), nh = next.hostname.toLowerCase();
        if (MARK[lms].test(next.pathname) || MARK[lms].test(nh)) seenMark = true;
        // off to the school's sign-in (Microsoft, Google, a school login page): the site is where it came from
        seen += " " + next.href.toLowerCase();
        if (SSO.test(nh) && nh !== cur) return seenMark && owns(seen) ? cur : "";
        url = next.href; cur = nh;
        continue;
      }
      if (r.status < 200 || r.status >= 300) return "";
      const text = (await r.text().catch(() => "")).slice(0, 200000);
      const heads = [...r.headers.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
      return HOST.test(cur) && (seenMark || MARK[lms].test(text) || MARK[lms].test(heads)) && owns(seen + " " + cur + " " + text.toLowerCase()) ? cur : "";
    } catch (_e) { return ""; }
    finally { clearTimeout(t); }
  }
  return "";
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const text = await req.text();
    if (text.length > 1000) return json({ error: "bad request" }, 400);
    const body = (() => { try { return JSON.parse(text || "{}"); } catch (_e) { return {}; } })() as { key?: unknown; lms?: unknown };
    const lms = (["brightspace", "canvas", "blackboard"] as const).find(x => x === body.lms);
    const key = typeof body.key === "string" && /^[a-z0-9._:-]{3,120}$/i.test(body.key) ? body.key : "";
    if (!lms || !key) return json({ error: "bad request" }, 400);
    const sk = serviceKey(d), h = { apikey: sk, Authorization: `Bearer ${sk}`, "Content-Type": "application/json" };
    const rest = async (path: string, init: RequestInit = {}) => {
      const r = await d.fetch(`${base(d)}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
      if (!r.ok) throw new Error(`db ${path.split("?")[0]} ${r.status}`);
      return r;
    };
    // remembered?
    const k = encodeURIComponent(key);
    const kept = ((await (await rest(`school_lms?school_key=eq.${k}&lms=eq.${lms}&select=host,checked_at`)).json()) as any[])[0];
    if (kept && d.now() - Date.parse(kept.checked_at) < (kept.host ? HIT_DAYS : MISS_DAYS) * 86400_000) return json({ host: kept.host || "" });
    // a few lookups a minute from one visitor
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const rl = await (await rest("rpc/studyboard_plan_rate_hit", { method: "POST", body: JSON.stringify({ p_key: `lmsfind:${ip}`, p_max: 20, p_window: 600 }) })).json().catch(() => true);
    if (rl === false) return json({ error: "rate_limited" }, 429);
    const school = ((await (await rest(`schools?key=eq.${k}&select=domains,web,kind`)).json()) as any[])[0];
    if (!school) return json({ host: "" });
    const save = (sk: string, host: string) => rest("school_lms?on_conflict=school_key,lms", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ school_key: sk, lms, host, checked_at: new Date(d.now()).toISOString() }) }).catch(() => {});
    // a high school's district: in its key (US public schools' NCES id), or in school_districts
    const hs = school.kind === "high_school";
    // (these tables come from supabase-lms-districts.sql; without it, high schools are looked up like any school)
    const rows = async (path: string): Promise<any[]> => { try { const r = await (await rest(path)).json(); return Array.isArray(r) ? r : []; } catch (_e) { return []; } };
    const nces = /^hs:us:(\d{7})\d{5}$/.exec(key);
    let dist = hs && nces ? `us:${nces[1]}` : "";
    if (hs && !dist) dist = String((await rows(`school_districts?school_key=eq.${k}&select=district`))[0]?.district || "");
    let row: any = null;
    if (dist) {
      const dk = encodeURIComponent(`d:${dist}`);
      const dkept = (await rows(`school_lms?school_key=eq.${dk}&lms=eq.${lms}&select=host,checked_at`))[0];
      if (dkept && d.now() - Date.parse(dkept.checked_at) < (dkept.host ? HIT_DAYS : MISS_DAYS) * 86400_000) {
        await save(key, dkept.host || "");
        return json({ host: dkept.host || "" });
      }
      row = (await rows(`lms_districts?district=eq.${encodeURIComponent(dist)}&select=domains,brightspace,shared`))[0] || null;
    }
    const own = siteDomain(String(school.web || ""));
    const doms = [...new Set([...(row?.domains || []), own, ...(school.domains || []), ...(hs ? [] : [key])].map(siteDomain).filter(Boolean))];
    // a known address first (Ontario boards on the province's Brightspace), then the usual addresses, best first, a few at a time;
    // for a high school, a provider address named after a short or shared name must point back to the district's own domain
    const known = lms === "brightspace" && row?.brightspace ? [String(row.brightspace)] : [];
    const list = [...known, ...candidates(lms, doms).filter(c => !known.includes(c))];
    const mine = (c: string) => known.includes(c) || doms.some(x => c === x || c.endsWith("." + x));
    const strict = (c: string) => hs && !mine(c) && (row?.shared === true || c.split(".")[0].length < 4);
    let host = "";
    for (let i = 0; i < list.length && !host; i += AT_ONCE) {
      const got = await Promise.all(list.slice(i, i + AT_ONCE).map(c => probe(d, lms, c, strict(c) ? doms : [])));
      host = got.find(Boolean) || "";
    }
    await save(key, host);
    if (dist) await save(`d:${dist}`, host);
    return json({ host });
  } catch (err) {
    d.log("lms-find failed", err instanceof Error ? err.message : "error");
    return json({ error: "server error" }, 500);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
