// Studyboard: the address of a school's Brightspace, Canvas or Blackboard site, for "Find your school" in the app.
//
// POST /lms-find {key: "<school key from search_schools>", lms: "brightspace" | "canvas" | "blackboard" | "moodle"}
//   -> {host: "learn.bcit.ca"} or {host: ""} when none was found
// POST /lms-find {key, lms: "auto"} -> {host, lms}: which of the four the school uses (all four looked up at once)
//
// The schools list has each school's own web domain, not its school site, so this tries the addresses schools usually use
// (the school's own first, e.g. learn.bcit.ca, then the provider's, e.g. bcit.brightspace.com), checks which is really that
// kind of site, and remembers the answer for 30 days (a miss for a day) in school_lms. A school's own address comes first
// because a school's sign-in often only works through it (bcit.brightspace.com exists, but BCIT signs in at learn.bcit.ca).
// High schools: the school board or district runs the site, so this uses the district's domains (supabase-lms-districts.sql:
// Ontario boards, BC districts, US public school districts) and the address boards share in Ontario and BC, and remembers
// the answer for the whole district. District initials repeat (lcps.org, lcps.k12.nm.us), so a provider address named after
// a short or shared name (lcps.instructure.com) counts only when its sign-in points back to the district's own domain, or
// names the school's town (sno.instructure.com says "Snohomish School District 201").
// No sign-in needed; a few lookups a minute per visitor. supabase-schools.sql, supabase-lms-find.sql, supabase-lms-districts.sql.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };
type Lms = "brightspace" | "canvas" | "blackboard" | "moodle";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
// anything remembered before the lookup last improved is looked up again (a miss, or a guess the older lookup got wrong)
const MISS_BEFORE = Date.parse("2026-11-01T12:00:00Z");
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
  const out = lms === "brightspace" ? [...own(["learn", "d2l", "brightspace", "elearning", "mycourses", "courses", "lms", "online", "elearn", "mylearning", "onlinelearning", "mycourses2", "courselink", "avenue", "onq", "owl"]), ...slugs.flatMap(s => [`${s}.brightspace.com`, `${s}.desire2learn.com`, `${s}-sb.brightspace.com`])]
    : lms === "canvas" ? [...own(["canvas", "learn", "courses", "lms", "elearning", "online", "bcourses", "canvas-prod"]), ...slugs.map(s => `${s}.instructure.com`)]
    : lms === "moodle" ? [...own(["moodle", "learn", "elearning", "lms", "courses", "online", "classes", "ilearn", "mycourses", "e-learning", "vle", "eclass", "moodle2", "learning", "elearn", "keats", "lms2", "ecampus"]), ...slugs.map(s => `${s}.moodlecloud.com`)]
    : [...own(["blackboard", "bb", "learn", "mycourses", "courses", "elearning", "online", "bblearn", "lms", "elearn", "learning"]), ...slugs.map(s => `${s}.blackboard.com`)];
  return [...new Set(out)].filter(h => HOST.test(h));
}

export const PROVIDER_HOST = /\.(instructure\.com|brightspace\.com|desire2learn\.com|blackboard\.com|moodlecloud\.com|elearningontario\.ca|onlinelearningbc\.com)$/i;
// Is this host really that kind of site? Returns the host to use (the one a provider address forwards to), or "".
const PATH: Record<Lms, string> = { brightspace: "/d2l/login", canvas: "/login", blackboard: "/webapps/login/", moodle: "/login/index.php" };
const MARK: Record<Lms, RegExp> = { brightspace: /d2l|brightspace|desire2learn/i, canvas: /instructure/i, blackboard: /blackboard|bb-|\/webapps\/|learn\.ultra|anthology/i, moodle: /moodle|M\.cfg|\/lib\/javascript\.php|\/theme\/(image|styles|yui_combo)\.php/i };
// what each platform puts in its answers' headers (Canvas's own header, the platforms' sign-in cookies), on every answer:
// a redirect to the school's sign-in, or an error page (SDSU's Canvas has no Canvas sign-in page, so /login/canvas is a 404)
// (header names, and cookie names as they're set: "name=", never a cookie's domain)
const HEAD_MARK: Record<Lms, RegExp> = { canvas: /^x-canvas-meta:|\b(canvas_session|_normandy_session|_legacy_normandy_session)=/im, brightspace: /\b(d2lSessionVal|d2lSecureSessionVal|d2lSameSiteCanaryA|d2lSameSiteCanaryB)=|^x-d2l/im,
  blackboard: /\b(BbRouter|BbClientCalenderTimeZone|bb_session)=|^x-blackboard/im, moodle: /\bMoodleSession[A-Za-z0-9]*=|^x-moodle/im };
// each platform's own provider addresses: a check for one platform that ends up on another's isn't that platform
const OWN_PROVIDER: Record<Lms, RegExp> = { canvas: /\.instructure\.com$/i, brightspace: /\.(brightspace\.com|desire2learn\.com|elearningontario\.ca|onlinelearningbc\.com)$/i,
  blackboard: /\.blackboard\.com$/i, moodle: /\.moodlecloud\.com$/i };
// a school sign-in step (SAML, CAS, OAuth, Shibboleth, D2L's initiate-login)
const SSO_PATH = /\/(saml|cas|oauth2?|openid|sso|shibboleth|adfs|idp)\b|initiate-login|samlLogin|auth_oidc/i;
const SSO = /(^|\.)(microsoftonline\.com|login\.microsoft\.com|accounts\.google\.com|okta\.com|onelogin\.com|duosecurity\.com|shibboleth|cas\.|sso\.|idp\.|auth\.|login\.)/i;
// need: for a provider address, the school's own domains, one of which the redirects or the page must mention.
// The answer is where the platform itself answered: the host whose answer carried the platform's own headers (Canvas's
// header, D2L's or Moodle's sign-in cookies), so a school web page that only mentions Canvas doesn't count; failing that, the
// address asked (or a provider's) when its page is plainly the platform's. sso: it sent you on to a school sign-in, which a
// school's live site does and a forgotten trial site doesn't.
export async function probeX(d: Deps, lms: Lms, host: string, need: string[] = []): Promise<{ host: string; sso: boolean }> {
  let url = `https://${host}${PATH[lms]}`, cur = host, seenMark = false, seen = "", markHost = "", sso = false;
  const owns = (t: string) => !need.length || need.some(x => t.includes(x));
  const none = { host: "", sso: false };
  // the answer: where the platform answered, unless that's another platform's provider address
  const ans = (h: string) => !h || (PROVIDER_HOST.test(h) && !OWN_PROVIDER[lms].test(h)) ? none : { host: h, sso };
  // once the platform has answered, a later step of the school's sign-in failing doesn't undo that
  const after = () => markHost && owns(seen + " " + cur) ? ans(markHost) : none;
  for (let hop = 0; hop < 7; hop++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), PROBE_MS);
    try {
      const r = await d.fetch(url, { redirect: "manual", signal: ctl.signal, headers: { "User-Agent": "Mozilla/5.0 (Studyboard school finder)", Accept: "text/html" } });
      // only the platforms' own headers and cookies (a university page's security header can list instructure.com too)
      const heads = [...r.headers.entries()].filter(([k]) => /^(set-cookie|x-canvas|x-d2l|x-blackboard|x-moodle)/i.test(k)).map(([k, v]) => `${k}: ${v}`).join("\n");
      // (the last such host: a provider address that forwards to the school's own, ubc.instructure.com to canvas.ubc.ca)
      if (HEAD_MARK[lms].test(heads)) { seenMark = true; if (HOST.test(cur)) markHost = cur; }
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location"); if (!loc) return after();
        const next = new URL(loc, url), nh = next.hostname.toLowerCase();
        if (MARK[lms].test(nh)) seenMark = true;
        // a redirect to a path only the platform has (/d2l/lp/auth/login/samlLogin.d2l) marks where it came from; not one that
        // just repeats the path asked for (/d2l/login/, /online/d2l/login)
        const np = next.pathname.replace(/\/+$/, ""), asked = PATH[lms].replace(/\/+$/, "");
        if (!np.endsWith(asked) && MARK[lms].test(np) && HOST.test(cur)) { seenMark = true; markHost = cur; }
        if (SSO_PATH.test(next.pathname + next.search)) sso = true;
        seen += " " + next.href.toLowerCase();
        // off to the school's sign-in (Microsoft, Google, a school login page): the site is where it came from
        if (SSO.test(nh) && nh !== cur) { sso = true; const h2 = markHost || (seenMark ? cur : ""); return h2 && owns(seen) ? ans(h2) : none; }
        url = next.href; cur = nh;
        continue;
      }
      // an error page from the platform itself (it marked its headers) still says the site is there; but Canvas answering its
      // sign-in address with "not found" is a Canvas address no school uses (dal.instructure.com)
      if (r.status === 404 && lms === "canvas" && /\/login$/.test(new URL(url).pathname)) return none;
      if (r.status >= 400) return after();
      if (r.status < 200) return none;
      if (markHost) return owns(seen + " " + cur) || owns((await r.text().catch(() => "")).slice(0, 200000).toLowerCase()) ? ans(markHost) : none;
      const text = (await r.text().catch(() => "")).slice(0, 200000);
      // no platform headers: only the address asked, or a provider's, whose page is plainly the platform's
      const ok = HOST.test(cur) && (cur === host || PROVIDER_HOST.test(cur)) && (seenMark || MARK[lms].test(text)) && owns(seen + " " + cur + " " + text.toLowerCase());
      return ok ? ans(cur) : none;
    } catch (_e) { return after(); }
    finally { clearTimeout(t); }
  }
  return after();
}
export const probe = async (d: Deps, lms: Lms, host: string, need: string[] = []): Promise<string> => (await probeX(d, lms, host, need)).host;

// Canvas's own school directory (what the Canvas Student app's "Find my school" uses): it knows addresses no guess would
// (UC Irvine is canvas.eee.uci.edu). A listing counts when its address is on the school's own domain or named after it
// (sdsu.instructure.com for sdsu.edu); for a university, also when its name is the school's name.
const CANVAS_DIR = "https://canvas.instructure.com/api/v1/accounts/search";
const words = (s: string) => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\b(the|at|of|and)\b/g, " ").replace(/\s+/g, " ").trim();
const PLAIN = new Set(["university", "college", "state", "community", "school", "institute", "technology", "of", "the", "and", "at", "campus", "high", "district", "public", "schools", "academy", "center", "centre", "de", "la", "du", "des", "et"]);
export async function canvasDirectory(d: Deps, name: string, doms: string[], town: string, hs: boolean): Promise<string> {
  return (await canvasDirectoryX(d, name, doms, town, hs)).host;
}
// exact: the listing is under the school's own name (not one of its units, like "Georgetown University - OPVS")
export async function canvasDirectoryX(d: Deps, name: string, doms: string[], town: string, hs: boolean): Promise<{ host: string; exact: boolean }> {
  const slugs = new Set(doms.map(x => x.split(".")[0]).filter(x => x.length >= 3));
  const own = (h: string) => doms.some(x => h === x || h.endsWith("." + x));
  const named = (h: string) => /\.instructure\.com$/.test(h) && slugs.has(h.split(".")[0]);
  const plain = words(name).split(" ").filter(w => w.length >= 4 && !PLAIN.has(w));
  // the full name, then its place (usually last: "University of California, Irvine"), then its first distinctive word
  const terms = [...new Set([name, hs ? town : plain[plain.length - 1], plain[0]].map(x => String(x || "").trim()).filter(x => x.length >= 3))].slice(0, 3);
  let byName = "";
  for (const term of terms) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
    let list: any[] = [];
    try {
      const r = await d.fetch(`${CANVAS_DIR}?search_term=${encodeURIComponent(term.slice(0, 80))}&per_page=50`, { signal: ctl.signal, headers: { Accept: "application/json", "User-Agent": "Studyboard school finder" } });
      list = r.ok ? await r.json() : [];
    } catch (_e) { list = []; } finally { clearTimeout(t); }
    if (!Array.isArray(list)) continue;
    // the school's main listing first: its own name, not a catalog, a training or professional development site, or one school
    // within it; then the shortest address
    const me = words(name), SIDE = /catalog|professional development|continuing|extension|training|sandbox|\btest|alumni|parent|employee|staff|faculty|\bpd\b|community|guest|demo|template|lifelong|outreach/i;
    const rank = (x: { host: string; name: string }) => (words(x.name) === me ? 4 : words(x.name).startsWith(me) ? 2 : 0) - (SIDE.test(x.name) ? 5 : 0) - x.host.split(".").length * 0.1;
    // a university isn't a school district's listing (Amherst College isn't Amherst County Public Schools)
    const K12 = /public schools|county|\b(isd|usd|cusd|sd|ps)\b|school district|parents|teachers|elementary|middle school|high school|k-?12/i;
    const hits = list.map(x => ({ host: String(x && x.domain || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""), name: String(x && x.name || "") }))
      .filter(x => HOST.test(x.host) && (hs || !K12.test(x.name))).sort((a, b) => rank(b) - rank(a));
    // named after the school loosely: the address starts like the school's (uncch for unc.edu, umamherst for umass.edu) and the
    // listing names the school's place (Chapel Hill, Amherst), so UNC Wilmington or Amherst College don't count
    const place = plain.length >= 2 ? plain[plain.length - 1] : "";
    const loose = (x: { host: string; name: string }) => !!place && /\.instructure\.com$/.test(x.host) && [...slugs].some(sl => x.host.slice(0, 3) === sl.slice(0, 3)) && words(x.name).split(" ").includes(place);
    // or the listing's name has every distinctive word of the school's ("Pasco-Hernando State College" for Pasco-Hernando
    // Community College, renamed since)
    const allWords = (x: { host: string; name: string }) => plain.length >= 2 && plain.every(w => words(x.name).split(" ").includes(w));
    const best = hits.find(x => own(x.host) && rank(x) > -3) || hits.find(x => named(x.host) && rank(x) > -3) || hits.find(x => loose(x) && rank(x) > -3) || hits.find(x => allWords(x) && rank(x) > -3);
    if (best) return { host: best.host, exact: words(best.name) === me };
    if (!hs && !byName) byName = (hits.find(x => words(x.name) === words(name)) || {}).host || "";
  }
  return { host: byName, exact: !!byName };
}

const LMS_ALL: Lms[] = ["canvas", "brightspace", "blackboard", "moodle"];
export async function handle(req: Request, d: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const text = await req.text();
    if (text.length > 1000) return json({ error: "bad request" }, 400);
    const body = (() => { try { return JSON.parse(text || "{}"); } catch (_e) { return {}; } })() as { key?: unknown; lms?: unknown };
    // lms "auto": which of the four the school uses (the first that answers, Canvas, Brightspace, Blackboard, then Moodle)
    const auto = body.lms === "auto", one = LMS_ALL.find(x => x === body.lms);
    const key = typeof body.key === "string" && /^[a-z0-9._:-]{3,120}$/i.test(body.key) ? body.key : "";
    if ((!auto && !one) || !key) return json({ error: "bad request" }, 400);
    const want: Lms[] = auto ? LMS_ALL : [one as Lms];
    const answer = (got: Partial<Record<Lms, string>>) => {
      if (!auto) return json({ host: got[want[0]] || "" });
      const l = LMS_ALL.find(x => got[x]); return json({ host: l ? got[l] : "", lms: l || "" });
    };
    const sk = serviceKey(d), h = { apikey: sk, Authorization: `Bearer ${sk}`, "Content-Type": "application/json" };
    const rest = async (path: string, init: RequestInit = {}) => {
      const r = await d.fetch(`${base(d)}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
      if (!r.ok) throw new Error(`db ${path.split("?")[0]} ${r.status}`);
      return r;
    };
    const rows = async (path: string): Promise<any[]> => { try { const r = await (await rest(path)).json(); return Array.isArray(r) ? r : []; } catch (_e) { return []; } };
    const fresh = (x: any) => !!x && Date.parse(x.checked_at) >= MISS_BEFORE && d.now() - Date.parse(x.checked_at) < (x.host ? HIT_DAYS : MISS_DAYS) * 86400_000;
    const save = (sk2: string, lms: Lms, host: string) => rest("school_lms?on_conflict=school_key,lms", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ school_key: sk2, lms, host, checked_at: new Date(d.now()).toISOString() }) }).catch(() => {});
    // remembered?
    const k = encodeURIComponent(key), got: Partial<Record<Lms, string>> = {};
    const kept = await rows(`school_lms?school_key=eq.${k}&select=lms,host,checked_at`);
    want.forEach(l => { const r = kept.find(x => x && x.lms === l); if (fresh(r)) got[l] = r.host || ""; });
    if (want.every(l => l in got)) return answer(got);
    // a few lookups a minute from one visitor
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const rl = await (await rest("rpc/studyboard_plan_rate_hit", { method: "POST", body: JSON.stringify({ p_key: `lmsfind:${ip}`, p_max: 20, p_window: 600 }) })).json().catch(() => true);
    if (rl === false) return json({ error: "rate_limited" }, 429);
    const school = ((await (await rest(`schools?key=eq.${k}&select=name,domains,web,kind,city`)).json()) as any[])[0];
    if (!school) return answer(got);
    // a high school's district: in its key (US public schools' NCES id), or in school_districts
    // (these tables come from supabase-lms-districts.sql; without it, high schools are looked up like any school)
    const hs = school.kind === "high_school";
    const nces = /^hs:us:(\d{7})\d{5}$/.exec(key);
    let dist = hs && nces ? `us:${nces[1]}` : "";
    if (hs && !dist) dist = String((await rows(`school_districts?school_key=eq.${k}&select=district`))[0]?.district || "");
    let row: any = null;
    if (dist) {
      const dkept = await rows(`school_lms?school_key=eq.${encodeURIComponent(`d:${dist}`)}&select=lms,host,checked_at`);
      for (const l of want) { if (l in got) continue; const r = dkept.find(x => x && x.lms === l); if (fresh(r)) { got[l] = r.host || ""; await save(key, l, r.host || ""); } }
      if (want.every(l => l in got)) return answer(got);
      row = (await rows(`lms_districts?district=eq.${encodeURIComponent(dist)}&select=domains,brightspace,shared`))[0] || null;
    }
    const own = siteDomain(String(school.web || ""));
    const doms = [...new Set([...(row?.domains || []), own, ...(school.domains || []), ...(hs ? [] : [key])].map(siteDomain).filter(Boolean))];
    // what a provider address's page may mention to count as this district's: its domains, or the school's town
    const town = String(school.city || "").toLowerCase().trim();
    const hints = [...doms, ...(town.length >= 5 ? [town] : [])];
    const findOne = async (lms: Lms): Promise<{ host: string; score: number }> => {

      // a known address first (Ontario and BC boards on the province's Brightspace), then the usual addresses, best first, a few
      // at a time; for a high school, a provider address named after a short or shared name must point back to the district
      const known = lms === "brightspace" && row?.brightspace ? [String(row.brightspace)] : [];
      const list = [...known, ...candidates(lms, doms).filter(c => !known.includes(c))];
      const mine = (c: string) => known.includes(c) || doms.some(x => c === x || c.endsWith("." + x));
      // where a found site may end up: the school's own domain, or the provider's (not some other host it forwarded to)
      const landed = (h2: string) => !!h2 && (mine(h2) || PROVIDER_HOST.test(h2));
      const strict = (c: string) => hs && !mine(c) && (row?.shared === true || c.split(".")[0].length < 4);
      let hit = { host: "", sso: false };
      for (let i = 0; i < list.length && !hit.host; i += AT_ONCE) {
        const res = await Promise.all(list.slice(i, i + AT_ONCE).map(c => probeX(d, lms, c, strict(c) ? hints : [])));
        hit = res.find(x => landed(x.host)) || hit;
      }
      // how sure: on the school's own domain (or a board's known address) 3, a provider's 1; and 1 more when it sends you on to a
      // school sign-in, as a school's live site does and a forgotten one usually doesn't
      let host = hit.host, score = !host ? 0 : (mine(host) ? 3 : 1) + (hit.sso ? 1 : 0);
      // a Canvas provider address with no school sign-in set up is often one a school tried and left: below the other platforms
      if (lms === "canvas" && host && !mine(host) && !hit.sso) score = 0.5;
      // Canvas: its own school directory, when no usual address answered or only a provider's did
      if (lms === "canvas" && score < 3) {
        const dir = await canvasDirectoryX(d, String(school.name || ""), doms, town, hs).catch(() => ({ host: "", exact: false }));
        // the directory's address replaces a guess when nothing was found, or it's listed under the school's own name
        if (dir.host && dir.host !== host && (!host || (dir.exact && mine(dir.host)))) { host = dir.host; score = mine(dir.host) && dir.exact ? 3 : 2; }
      }
      await save(key, lms, host);
      if (dist) await save(`d:${dist}`, lms, host);
      return { host, score };
    };
    const scores: Partial<Record<Lms, number>> = {};
    await Promise.all(want.filter(l => !(l in got)).map(async l => { const r = await findOne(l); got[l] = r.host; scores[l] = r.score; }));
    if (auto) {
      // the surest first (a site on the school's own domain beats a provider address), then Canvas, Brightspace, Blackboard, Moodle
      const sure = (l: Lms) => scores[l] != null ? scores[l]! : got[l] ? 2 : 0;
      const l = LMS_ALL.filter(x => got[x]).sort((a2, b2) => sure(b2) - sure(a2) || LMS_ALL.indexOf(a2) - LMS_ALL.indexOf(b2))[0];
      return json({ host: l ? got[l] : "", lms: l || "" });
    }
    return answer(got);
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
