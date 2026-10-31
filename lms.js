// Studyboard desktop
const HT_ENT = {amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ensp: " ", emsp: " ", thinsp: " ", zwnj: "", zwj: "", shy: "", lrm: "", rlm: "",
  lsquo: "\u2018", rsquo: "\u2019", sbquo: "\u201A", ldquo: "\u201C", rdquo: "\u201D", bdquo: "\u201E", laquo: "\u00AB", raquo: "\u00BB", lsaquo: "\u2039", rsaquo: "\u203A",
  ndash: "\u2013", mdash: "\u2014", hellip: "\u2026", bull: "\u2022", middot: "\u00B7", sdot: "\u22C5", dagger: "\u2020", Dagger: "\u2021", prime: "\u2032", Prime: "\u2033",
  copy: "\u00A9", reg: "\u00AE", trade: "\u2122", deg: "\u00B0", plusmn: "\u00B1", times: "\u00D7", divide: "\u00F7", minus: "\u2212", frac12: "\u00BD", frac14: "\u00BC", frac34: "\u00BE",
  sup1: "\u00B9", sup2: "\u00B2", sup3: "\u00B3", micro: "\u00B5", para: "\u00B6", sect: "\u00A7", cent: "\u00A2", pound: "\u00A3", yen: "\u00A5", euro: "\u20AC", curren: "\u00A4",
  iexcl: "\u00A1", iquest: "\u00BF", ne: "\u2260", le: "\u2264", ge: "\u2265", asymp: "\u2248", infin: "\u221E", larr: "\u2190", rarr: "\u2192", uarr: "\u2191", darr: "\u2193", harr: "\u2194", check: "\u2713",
  alpha: "\u03B1", beta: "\u03B2", gamma: "\u03B3", delta: "\u03B4", mu: "\u03BC", pi: "\u03C0", sigma: "\u03C3", omega: "\u03C9", Omega: "\u03A9", Delta: "\u0394", ordf: "\u00AA", ordm: "\u00BA",
  szlig: "\u00DF", aelig: "\u00E6", AElig: "\u00C6", oslash: "\u00F8", Oslash: "\u00D8", ntilde: "\u00F1", Ntilde: "\u00D1", ccedil: "\u00E7", Ccedil: "\u00C7"};
const HT_ACC = {grave: "\u0300", acute: "\u0301", circ: "\u0302", tilde: "\u0303", uml: "\u0308", ring: "\u030A", cedil: "\u0327"};
// Only real HTML tag names count as markup
const HT_TAGS = "a|abbr|address|article|aside|audio|b|bdi|bdo|big|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|dd|del|details|dfn|dialog|div|dl|dt|em|fieldset|figcaption|figure|font|footer|form|h[1-6]|header|hr|html|i|img|input|ins|kbd|label|legend|li|link|main|mark|meta|nav|o:p|ol|optgroup|option|p|pre|q|s|samp|section|select|small|source|span|strike|strong|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|tr|tt|u|ul|var|video|wbr|!doctype|\\?xml";
const HT_TAGRE = new RegExp("<\\/?(?:" + HT_TAGS + ")(?=[\\s/>])(?:\"[^\"]*\"|'[^']*'|[^<>\"'])*>", "gi");
const HT_OPENRE = new RegExp("<\\/?(?:" + HT_TAGS + ")(?:\\s[^<>]*)?$", "i");
const HT_HAS = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function htmlText(s, opts){
  const o = opts || {};
  if (s == null || s === "") return "";
  const t0 = typeof s === "string" ? s : typeof s === "object" ? "" : String(s);
  if (!t0) return "";
  let t = t0;
  const dec = (m, name) => {
    if (name[0] === "#") { const n = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10); return n > 0 && n <= 0x10FFFF && !(n >= 0xD800 && n <= 0xDFFF) ? (n === 160 ? " " : String.fromCodePoint(n)) : ""; }
    if (HT_HAS(HT_ENT, name)) return HT_ENT[name];
    const lm = /^([A-Za-z])(grave|acute|circ|tilde|uml|ring|cedil)$/.exec(name); if (lm) return (lm[1] + HT_ACC[lm[2]]).normalize("NFC");
    return m;
  };
  for (let i = 0; i < 5; i++) {
    const before = t;
    t = t.replace(/<!--[\s\S]*?(-->|$)/g, "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<(script|style|head|template|noscript|iframe|object|embed|svg|math)\b[\s\S]*?(<\/\1\s*>|$)/gi, " ")
      .replace(/<\s*br\b[^>]*>/gi, "\n").replace(/<\s*li\b[^>]*>/gi, "\n\u2022 ")
      .replace(/<\/\s*(p|div|h[1-6]|tr|ul|ol|table|blockquote|section|article|pre|dl|dt|dd|header|footer|figure)\s*>/gi, "\n")
      .replace(/<\s*(p|div|h[1-6]|tr|ul|ol|table|blockquote|hr)\b[^>]*>/gi, "\n").replace(/<\/\s*(td|th)\s*>/gi, " ")
      .replace(HT_TAGRE, "").replace(HT_OPENRE, "")
      .replace(/&(#[xX][0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]{1,9});?/g, (m, n) => m.endsWith(";") || n[0] === "#" || HT_HAS(HT_ENT, n) ? dec(m, n) : m);
    if (t === before) break;
  }
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2060\uFEFF\u00AD]/g, "").replace(/[ \t\f\v\u00A0\u2000-\u200A\u202F\u205F\u3000]+/g, " ").replace(/\r\n?/g, "\n");
  t = o.line ? t.replace(/\s+/g, " ") : t.replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n");
  t = t.trim();
  return o.max && t.length > o.max ? t.slice(0, o.max) : t;
}
// The harvest functions below run inside the school's page (executeJavaScript)
const HARVEST_PRELUDE = [
  "const HT_ENT = " + JSON.stringify(HT_ENT) + ";",
  "const HT_ACC = " + JSON.stringify(HT_ACC) + ";",
  "const HT_TAGRE = " + HT_TAGRE.toString() + ";",
  "const HT_OPENRE = " + HT_OPENRE.toString() + ";",
  "const HT_HAS = " + HT_HAS.toString() + ";",
  htmlText.toString()
].join("\n");
const { BrowserWindow, ipcMain, net, session, app, dialog } = require("electron");
const path = require("path");
const fsp = require("fs").promises;
const dns = require("dns");

const busy = {};

// "learn.example.edu", "https://learn.example.edu/d2l/home" or similar -> "https://learn.example.edu". Only real https hostnames.
function originOf(host) {
  let s = String(host || "").trim();
  if (!s || s.length > 300) return null;
  if (TEST_MODE && /^http:\/\/127\.0\.0\.1:\d+$/.test(s)) return s;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h) || /^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(h) || LOCAL_SUFFIX.test(h)) return null;
    return "https://" + h + (u.port && u.port !== "443" ? ":" + u.port : "");
  } catch (e) { return null; }
}
// Names that only mean something on a home or office network, never a school's public site
const LOCAL_SUFFIX = /(^|\.)(local|lan|home|internal|localhost|intranet|corp|home\.arpa)$/;
// Addresses that are not on the public internet: private, loopback, link-local, carrier-grade NAT, multicast and reserved ranges.
function privateIp(ip) {
  const s = String(ip || "").toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const v4 = s.match(/^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 192 && b === 0 && Number(v4[3]) === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (!s.includes(":")) return true;
  const m = s.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (m) { const n = parseInt(m[1], 16), k = parseInt(m[2], 16); return privateIp([n >> 8, n & 255, k >> 8, k & 255].join(".")); }
  return s === "::" || s === "::1" || /^f[cd]/.test(s) || /^fe[89ab]/.test(s) || /^ff/.test(s) || /^64:ff9b:/.test(s) || /^2001:db8:/.test(s) || /^::ffff:/.test(s);
}
// Some sign-in pages turn away browsers they don't recognise
function chromeUA() { return String(app.userAgentFallback || "").replace(/\s(Electron|studyboard|Studyboard|studioso)\/\S+/g, ""); }
// What the platforms' data APIs see instead
const API_URLS = ["https://*/api/v1/*", "https://*/d2l/api/*", "https://*/learn/api/*", "https://*/lib/ajax/service.php*"];
function apiUA() { return chromeUA() + " Studyboard/" + (app.getVersion ? app.getVersion() : "") + " (+https://studyboardapp.com)"; }
// Security: the school windows are sandboxed and isolated like the app's own
const prefs = P => ({ partition: P.part, contextIsolation: true, nodeIntegration: false, nodeIntegrationInWorker: false, nodeIntegrationInSubFrames: false, sandbox: true,
  webSecurity: true, allowRunningInsecureContent: false, webviewTag: false, navigateOnDragDrop: false, safeDialogs: true, devTools: !app.isPackaged });
const TEST_MODE = process.env.STUDYBOARD_BS_TEST === "1" && !app.isPackaged;
const httpsOnly = raw => { try { const u = new URL(String(raw)); return u.protocol === "https:" || (TEST_MODE && u.protocol === "http:" && u.hostname === "127.0.0.1"); } catch (e) { return false; } };
const locked = new Set();
function lockPartition(part) {
  if (locked.has(part)) return; locked.add(part);
  const ses = session.fromPartition(part);
  ses.setPermissionRequestHandler((wc, perm, cb) => cb(false));
  ses.setPermissionCheckHandler(() => false);
  ses.setDevicePermissionHandler(() => false);
  try { ses.setDisplayMediaRequestHandler((req, cb) => cb({})); } catch (e) {}
  ses.webRequest.onBeforeRequest({ urls: ["http://*/*", "ws://*/*", "ftp://*/*"] }, (d, cb) => {
    let local = false; try { local = TEST_MODE && new URL(d.url).hostname === "127.0.0.1"; } catch (e) {}
    cb({ cancel: !local });
  });
  ses.webRequest.onBeforeSendHeaders({ urls: API_URLS }, (d, cb) => {
    const h = Object.assign({}, d.requestHeaders); h["User-Agent"] = apiUA(); cb({ requestHeaders: h });
  });
}
// Staying signed in follows the school's own rules
function guardWindow(w, Pv, sameOrigin) {
  const wc = w.webContents;
  wc.on("will-attach-webview", e => e.preventDefault());
  const nav = (e, url) => { if (!httpsOnly(url) || (sameOrigin && (() => { try { return new URL(url).origin !== sameOrigin; } catch (err) { return true; } })())) e.preventDefault(); };
  wc.on("will-navigate", nav); wc.on("will-redirect", nav);
  if (app.isPackaged) wc.on("devtools-opened", () => { try { wc.closeDevTools(); } catch (e) {} });
  wc.setWindowOpenHandler(({ url }) => sameOrigin || !httpsOnly(url) ? { action: "deny" } : { action: "allow", overrideBrowserWindowOptions: { autoHideMenuBar: true, webPreferences: prefs(Pv) } });
  wc.on("did-create-window", child => { guardWindow(child, Pv, null); showHost(child); });
}
// The sign-in window and its pop-ups always show which site is on screen
function showHost(w) {
  const wc = w.webContents;
  const set = () => { if (w.isDestroyed()) return; let h = ""; try { h = new URL(wc.getURL()).host; } catch (e) {} if (h) w.setTitle("Studyboard \u2013 sign in: " + h); };
  w.on("page-title-updated", e => { e.preventDefault(); set(); });
  wc.on("did-navigate", set); wc.on("did-navigate-in-page", set); wc.on("did-redirect-navigation", set);
  w.once("ready-to-show", set);
}
const timeout = (ms, what) => new Promise((_, rej) => setTimeout(() => rej(new Error(what || "timeout")), ms));

// Who's signed in (run inside the platform's own page)
const WHO = {
  brightspace: `(async () => {
  try {
    const v = await (await fetch('/d2l/api/versions/', {credentials: 'include'})).json();
    const lp = ((v || []).find(x => String(x.ProductCode).toLowerCase() === 'lp') || {}).LatestVersion || '1.30';
    const r = await fetch('/d2l/api/lp/' + lp + '/users/whoami', {credentials: 'include', headers: {Accept: 'application/json'}});
    if (!r.ok) return null; const me = await r.json();
    return (me.Identifier || me.FirstName || me.UniqueName) ? {name: [me.FirstName, me.LastName].filter(Boolean).join(' ')} : null;
  } catch (e) { return null; }
})()`,
  canvas: `(async () => {
  try { const r = await fetch('/api/v1/users/self', {credentials: 'include', headers: {Accept: 'application/json'}}); if (!r.ok) return null; const me = await r.json(); return me && me.id ? {name: me.name || me.short_name || ''} : null; } catch (e) { return null; }
})()`,
  moodle: `(async () => {
  try {
    const r = await fetch('/user/profile.php', {credentials: 'include', headers: {Accept: 'text/html'}});
    if (!r.ok || new URL(r.url).origin !== location.origin || /\\/login\\//.test(new URL(r.url).pathname)) return null;
    const d = new DOMParser().parseFromString(await r.text(), 'text/html');
    if (!d.querySelector('[data-userid], .usermenu .usertext, #user-menu-toggle, .userbutton')) return null;
    const h = d.querySelector('.page-header-headings h1, .page-header-headings h2') || d.querySelector('h1, h2');
    return {name: h ? h.textContent.trim().slice(0, 120) : ''};
  } catch (e) { return null; }
})()`,
  blackboard: `(async () => {
  for (const p of ['/learn/api/public/v1/users/me', '/learn/api/v1/users/me']) {
    try { const r = await fetch(p, {credentials: 'include', headers: {Accept: 'application/json'}}); if (!r.ok) continue; const me = await r.json();
      if (me && me.id) return {name: me.name ? [me.name.given, me.name.family].filter(Boolean).join(' ') : [me.givenName, me.familyName].filter(Boolean).join(' ')}; } catch (e) {}
  }
  return null;
})()`
};

// Brightspace: read everything (runs inside a hidden Brightspace page)
async function bsHarvest(o) {
  const q = o || {}, now = Date.now(), T0 = now;
  // The extras (quiz and topic pages, every topic's posts) stop when this runs out, so a big term still finishes inside the caller's
  // limit and keeps what it read; the essentials (courses, dates, submissions, Grades) come first
  const budgetEnd = T0 + Math.max(30000, Math.min(600000, Number(q.budget) || 120000)), hasTime = () => Date.now() < budgetEnd;
  let outOfTime = 0; const spend = () => { if (hasTime()) return true; outOfTime++; return false; };
  const fromISO = new Date(now - (q.pastDays || 60) * 864e5).toISOString();
  const toISO = new Date(now + (q.aheadDays || 240) * 864e5).toISOString();
  const enc = encodeURIComponent, errors = [];
  const get = async (p, tries) => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(p, { credentials: "include", headers: { Accept: "application/json" }, signal: ctl.signal });
      if ((r.status === 429 || r.status === 503) && (tries || 0) < 3) { clearTimeout(tm); await new Promise(res => setTimeout(res, 1500 * ((tries || 0) + 1))); return get(p, (tries || 0) + 1); }
      if (r.status === 401 || r.status === 403) { const e = new Error("denied"); e.status = r.status; throw e; }
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return await r.json();
    } finally { clearTimeout(tm); }
  };
  const soft = async (p, quiet) => { try { return await get(p); } catch (e) { if (!quiet) errors.push(String(p).replace(/\?.*/, "").replace(/\/\d{3,}\//g, "/#/") + " " + (e.status || e.name || e.message)); return null; } };
  const listOf = x => Array.isArray(x) ? x : x && Array.isArray(x.Objects) ? x.Objects : x && Array.isArray(x.Items) ? x.Items : [];
  const pages = async (p, quiet, max) => {
    const out = []; let url = p;
    for (let i = 0; url && i < (max || 8); i++) {
      const r = await soft(url, quiet); if (!r) break;
      out.push(...listOf(r));
      url = r && !Array.isArray(r) && typeof r.Next === "string" && r.Next ? r.Next : null;
    }
    return out;
  };
  const txt = (h, n) => {
    if (h && typeof h === "object") h = h.Text && typeof h.Text === "object" ? h.Text : h;
    if (h && typeof h === "object") h = h.Text || h.Html || "";
    return htmlText(h, { max: n || 4000 });
  };
  // The Grades page as the student sees it (Grades in the course navbar): one row per grade item, read by its column headings
  // ("Points", "Weight Achieved", "Grade"). Category rows (no points of their own) are kept as categories.
  const gradesFromPage = html => {
    const cellsOf = row => [...String(row).matchAll(/<(t[hd])\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi)].map(m => ({ t: htmlText(m[3], { line: true }), span: Number((m[2].match(/colspan\s*=\s*["']?(\d+)/i) || [])[1]) || 1 }));
    const expand = cs => { const o = []; cs.forEach(c => { o.push(c.t); for (let k = 1; k < Math.min(c.span, 8); k++) o.push(""); }); return o; };
    const frac = t => { const m = String(t || "").match(/^\s*(-|–|[\d.]+)\s*\/\s*([\d.]+)\s*$/); return m ? { n: /^[\d.]+$/.test(m[1]) ? Number(m[1]) : null, d: Number(m[2]) } : null; };
    const out = []; let head = null;
    const table = (String(html).match(/<table\b[^>]*\bd_gd\b[\s\S]*?<\/table>/i) || String(html).match(/<table\b[\s\S]*?Grade Item[\s\S]*?<\/table>/i) || [""])[0];
    String(table).split(/<tr\b/i).slice(1).forEach(row => {
      const cs = expand(cellsOf(row)); if (!cs.length) return;
      const low = cs.map(x => x.toLowerCase());
      if (!head && (low.some(x => /^points$/.test(x)) || low.some(x => /^grade item$/.test(x)))) { head = { pts: low.findIndex(x => /^points$/.test(x)), w: low.findIndex(x => /weight achieved/.test(x)), g: low.findIndex(x => /^grade$/.test(x)) }; return; }
      const name = cs.find(x => x && !frac(x) && !/^[\d.\s%-]+$/.test(x)); if (!name || name.length > 200) return;
      const pts = head && head.pts >= 0 ? frac(cs[head.pts]) : cs.map(frac).find(Boolean) || null;
      const w = head && head.w >= 0 ? frac(cs[head.w]) : (cs.map(frac).filter(Boolean)[1] || null);
      const shown = (head && head.g >= 0 ? cs[head.g] : cs.find(x => /^[\d.]+\s*%$/.test(x))) || "";
      if (!pts && !w && !shown) return;
      out.push({ GradeObjectIdentifier: "gp" + out.length + ":" + name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40), GradeObjectName: name.trim(), GradeObjectType: pts ? 1 : 9,
        PointsNumerator: pts ? pts.n : null, PointsDenominator: pts ? pts.d : null, WeightedNumerator: w ? w.n : null, WeightedDenominator: w ? w.d : null, DisplayedGrade: String(shown).trim(), fromPage: true });
    });
    return out.slice(0, 200);
  };
  const dt = x => (x && typeof x === "string" && !isNaN(Date.parse(x))) ? x : null;

  let vs = null;
  try { vs = await get("/d2l/api/versions/"); } catch (e) { if (e.status === 401 || e.status === 403) return { needLogin: true }; }
  const ver = (code, def) => { const x = listOf(vs).find(v => String(v.ProductCode || "").toLowerCase() === code); return (x && x.LatestVersion) || def; };
  const lp = ver("lp", "1.30"), le = ver("le", "1.50");
  let me;
  try { me = await get(`/d2l/api/lp/${lp}/users/whoami`); }
  catch (e) { return e.status === 401 || e.status === 403 ? { needLogin: true } : { error: "whoami " + (e.status || e.message) }; }

  const ens = []; let bm = "";
  for (let i = 0; i < 12; i++) {
    const r = await soft(`/d2l/api/lp/${lp}/enrollments/myenrollments/?orgUnitTypeId=3${bm ? "&bookmark=" + enc(bm) : ""}`);
    if (!r) break;
    ens.push(...listOf(r));
    if (!r.PagingInfo || !r.PagingInfo.HasMoreItems || !r.PagingInfo.Bookmark) break;
    bm = r.PagingInfo.Bookmark;
  }
  const all = ens.filter(e => e && e.OrgUnit && e.OrgUnit.Id != null && (!e.Access || (e.Access.CanAccess !== false && e.Access.IsActive !== false)))
    .map(e => ({ ou: String(e.OrgUnit.Id), code: String(e.OrgUnit.Code || ""), name: String(e.OrgUnit.Name || ""), start: dt(e.Access && e.Access.StartDate), end: dt(e.Access && e.Access.EndDate), last: dt(e.Access && e.Access.LastAccessed) }));
  const current = c => (!c.end || Date.parse(c.end) > now - 45 * 864e5) && (!c.start || Date.parse(c.start) < now + 120 * 864e5);
  const only = Array.isArray(q.only) && q.only.length ? new Set(q.only.map(String)) : null;
  const skip = new Set((q.skip || []).map(String));
  const pick = all.filter(c => (only ? only.has(c.ou) : current(c)) && !skip.has(c.ou))
    .sort((a, b) => (Date.parse(b.last || 0) || 0) - (Date.parse(a.last || 0) || 0)).slice(0, 20);

  // Calendar entries: upcoming ones are read on their own, so a term's worth of past classes can't use up the page limit
  // and push next week's classes out of the sync. Upcoming first, then the past, each entry once.
  const nowISO = new Date(now).toISOString();
  const calendarOf = async b => {
    const cal = (s, e, max) => pages(`${b}/calendar/events/myEvents/?startDateTime=${enc(s)}&endDateTime=${enc(e)}`, true, max);
    const [ahead, past] = await Promise.all([cal(nowISO, toISO, 30), cal(fromISO, nowISO, 10)]);
    const seen = new Set();
    return ahead.concat(past).filter(e => { const k = e && e.CalendarEventId != null ? String(e.CalendarEventId) : ""; if (!e || (k && seen.has(k))) return false; if (k) seen.add(k); return true; });
  };
  const detail = async c => {
    const b = `/d2l/api/le/${le}/${c.ou}`;
    let gradesErr = "";
    const [folders, quizzes, gradesApi, fin, news, events, forums, roster, over, toc] = await Promise.all([
      soft(`${b}/dropbox/folders/`),
      pages(`${b}/quizzes/`, true),
      q.grades === false ? null : get(`${b}/grades/values/myGradeValues/`).catch(e => { gradesErr = String(e.status || e.name || e.message); errors.push(`${c.code || c.ou}: grades list ${gradesErr}`); return null; }),
      q.grades === false ? null : soft(`${b}/grades/final/values/myGradeValue`, true),
      q.news === false ? null : soft(`${b}/news/`, true),
      calendarOf(b),
      soft(`${b}/discussions/forums/`, true),
      soft(`${b}/classlist/`, true),
      soft(`${b}/overview`, true),
      soft(`${b}/content/toc`, true)
    ]);
    const inWin = d => { const x = Date.parse(d || ""); return !isNaN(x) && x > now - 60 * 864e5 && x < now + 240 * 864e5; };
    // Your marks: the grades list, or, when a course refuses it (403) or it's empty, the course's Grades page as you see it
    let grades = gradesApi;
    const gx = { list: q.grades === false ? "off" : gradesApi ? "ok, " + listOf(gradesApi).length + " rows" : "refused (" + (gradesErr || "?") + ")", page: "not read", rows: 0, sample: [] };
    if (q.grades !== false && !listOf(gradesApi).length) {
      try {
        const r = await fetch(`/d2l/lms/grades/my_grades/main.d2l?ou=${c.ou}`, { credentials: "include" });
        const login = !!(r.redirected && /\/login|\/d2l\/lp\/auth|saml|sso|shibboleth/i.test(String(r.url || "")));
        gx.page = login ? "sign-in page" : r.ok ? "ok" : "HTTP " + r.status;
        if (r.ok && !login) {
          const rows = gradesFromPage((await r.text()).slice(0, 3000000));
          gx.page += ", " + rows.length + " rows";
          if (rows.length) grades = rows;
        }
      } catch (e) { gx.page = "failed: " + (e && (e.name || e.message) || "error"); }
    }
    gx.rows = listOf(grades).length;
    gx.sample = listOf(grades).slice(0, 40).map(g => `${String(g.GradeObjectName || "").slice(0, 60)}${g.GradeObjectType === 9 ? " (category)" : ""}: ${g.PointsNumerator == null ? "-" : g.PointsNumerator} / ${g.PointsDenominator == null ? "-" : g.PointsDenominator}${g.WeightedDenominator != null ? ", weight " + (g.WeightedNumerator == null ? "-" : g.WeightedNumerator) + " / " + g.WeightedDenominator : ""}`);
    const fl = listOf(folders).filter(f => f && !f.IsHidden);
    const recent = fl.filter(f => { const d = Date.parse(f.DueDate || (f.Availability && f.Availability.EndDate) || ""); return isNaN(d) || (d > now - 60 * 864e5 && d < now + 240 * 864e5); }).slice(0, 60);
    const subs = {}, subAt = {}, fbk = {};
    const inBatches = async (list, fn) => { for (let i = 0; i < list.length; i += 6) await Promise.all(list.slice(i, i + 6).map(fn)); };
    let subFail = 0, subWhy = "", subOdd = 0;
    await inBatches(recent, async f => {
      const s0 = await get(`${b}/dropbox/folders/${f.Id}/submissions/mysubmissions/`).catch(e => { subFail++; subWhy = String(e.status || e.name || e.message); return null; });
      if (s0 == null) return;
      const s = Array.isArray(s0) ? s0 : listOf(s0).length ? listOf(s0) : typeof s0 === "object" && (s0.Submissions || s0.Status != null) ? [s0] : null;
      if (!s) { subOdd++; return; }
      subs[f.Id] = s.some(x => x && ((Array.isArray(x.Submissions) && x.Submissions.length > 0) || [1, 3, "1", "3", "Submitted", "Published"].includes(x.Status) || !!x.CompletionDate));
      const when = []; s.forEach(x => (x && x.Submissions || []).forEach(y => { if (y && dt(y.SubmissionDate)) when.push(y.SubmissionDate); }));
      if (when.length) subAt[f.Id] = when.sort().pop();
      const fe = s.map(x => x && x.Feedback).find(Boolean);
      if (fe) fbk[f.Id] = fe;
    });
    let fromPage = 0, folderHtml = null;
    if (recent.some(f => subs[f.Id] === undefined)) {
      try {
        const r = await fetch(`/d2l/lms/dropbox/user/folders_list.d2l?ou=${c.ou}&isprv=0`, { credentials: "include" });
        if (r.ok) {
          const html = folderHtml = (await r.text()).slice(0, 3000000);
          html.split(/(?=folder_submit_files\.d2l\?)/).slice(1).forEach(part => {
            const m = part.match(/^folder_submit_files\.d2l\?[^"'<>]*?\bdb=(\d+)/); if (!m || subs[m[1]] !== undefined) return;
            const row = htmlText(part.slice(0, 6000), { line: true });
            if (/\b[1-9]\d*\s+submissions?\b/i.test(row)) { subs[m[1]] = true; fromPage++; }
            else if (/\bnot\s+submitted\b/i.test(row)) { subs[m[1]] = false; fromPage++; }
          });
        }
      } catch (e) {}
    }
    if (recent.length) {
      const yes = recent.filter(f => subs[f.Id] === true).length, no = recent.filter(f => subs[f.Id] === false).length, unk = recent.length - yes - no;
      c.subNote = `${c.code || c.name}: ${yes} submitted, ${no} not, ${unk} unknown` + (subFail ? `; API refused ${subFail} (${subWhy})` : "") + (subOdd ? `; ${subOdd} unreadable answers` : "") + (fromPage ? `; ${fromPage} from the Assignments page` : "");
    }
    const quizApiN = quizzes.length;
    // A closed exam drops off the quiz list and the Quizzes page, but its calendar entry is still tied to it (and carries its id):
    // read it from there, on the exam's day, so its Submissions page (and mark) can still be found
    let qFromCal = 0, qFromToc = 0;
    const qKnown = new Set(quizzes.map(x => x && String(x.QuizId)));
    const tocTopics = []; const tocWalk = (ms, d) => (ms || []).forEach(m => { if (!m || d > 5) return; (m.Topics || []).forEach(t => tocTopics.push(t)); tocWalk(m.Modules, d + 1); });
    tocWalk(toc && toc.Modules, 0);
    tocTopics.forEach(t => {
      const qi = (String(t.Url || "").match(/[?&]qi=(\d+)/) || [])[1] || (Number(t.ActivityType) === 4 || /quiz/i.test(String(t.TypeIdentifier || "")) ? (t.ToolItemId != null ? String(t.ToolItemId) : "") : "");
      if (!qi || qKnown.has(qi) || qFromToc >= 10 || t.IsHidden) return;
      qKnown.add(qi); qFromToc++;
      quizzes.push({ QuizId: Number(qi) || qi, Name: String(t.Title || "Quiz").trim(), DueDate: t.EndDateTime || t.DueDate || null, StartDate: t.StartDateTime || null, EndDate: null, IsActive: true, fromToc: true, GradeItemId: t.GradeItemId != null ? t.GradeItemId : null });
    });
    const calTied = events.filter(e => e && String(e.OrgUnitId) === String(c.ou) && (e.IsAssociatedWithEntity || e.AssociatedEntity)).slice(0, 12)
      .map(e => `${String(e.Title || "").slice(0, 60)} [${e.AssociatedEntity ? String(e.AssociatedEntity.AssociatedEntityType || "?") + " " + String(e.AssociatedEntity.AssociatedEntityId) : "no id"}]`);
    const calExams = events.filter(e => e && String(e.OrgUnitId) === String(c.ou) && /\b(quiz|exam|midterm|final|test)\b/i.test(String(e.Title || ""))).slice(0, 8)
      .map(e => `${String(e.Title || "").slice(0, 60)} (${String(e.StartDateTime || "").slice(0, 10)}${e.IsAssociatedWithEntity || e.AssociatedEntity ? ", tied" : ""})`);
    events.filter(e => e && String(e.OrgUnitId) === String(c.ou) && e.AssociatedEntity && e.AssociatedEntity.AssociatedEntityId != null).forEach(e => {
      const ty = String(e.AssociatedEntity.AssociatedEntityType || ""), id = String(e.AssociatedEntity.AssociatedEntityId), title = String(e.Title || "");
      if (qKnown.has(id) || qFromCal >= 8) return;
      if (!(/quiz/i.test(ty) || (!/dropbox|assignment|discussion|topic|content|checklist|survey|grade/i.test(ty) && /\b(quiz|exam|midterm|final|test)\b/i.test(title)))) return;
      qKnown.add(id); qFromCal++;
      quizzes.push({ QuizId: Number(id) || id, Name: title.replace(/^\s*[A-Z]{2,5}[\s_-]?\d{3,4}[A-Z]?\s*[-–:]?\s*/, "").replace(/\s*[-–:]\s*(due|available|availability ends|ends|closes)\s*$/i, "").trim() || title, DueDate: e.StartDateTime, StartDate: null, EndDate: null, IsActive: true, fromCal: true, GradeItemId: null });
    });
    const qrecent = quizzes.filter(x => { if (!x || x.IsActive === false) return false; const d = Date.parse(x.DueDate || x.EndDate || x.StartDate || ""); return isNaN(d) || (d > now - 60 * 864e5 && d < now + 240 * 864e5); }).slice(0, 40);
    const tried = {}, satAt = {};
    let qRefused = 0, qPage = 0, qPageStatus = "", qLinks = 0, qOwn = 0;
    await inBatches(qrecent, async x => {
      if (!spend()) return;
      const a = await soft(`${b}/quizzes/${x.QuizId}/attempts/`, true);
      if (!a) qRefused++;
      if (a) tried[x.QuizId] = listOf(a).some(t => t && (t.AttemptId != null || t.AttemptNumber != null || t.TimeCompleted || t.DateCompleted || t.SubmittedDate || t.IsGraded === true || (t.Score != null && t.Score !== "")));
      // when you finished it (your first attempt), so a task made from it is dated by that and not by the day it was read
      const when = a ? listOf(a).map(t => t && (dt(t.TimeCompleted) || dt(t.DateCompleted) || dt(t.SubmittedDate) || dt(t.TimeStarted))).filter(Boolean).sort() : [];
      if (when.length) satAt[x.QuizId] = when[0];
    });
    let qOnlyPage = 0;
    if (qrecent.some(x => tried[x.QuizId] !== true) || !quizzes.length) {
      try {
        const r = await fetch(`/d2l/lms/quizzing/user/quizzes_list.d2l?ou=${c.ou}`, { credentials: "include" });
        qPageStatus = String(r.status) + (r.redirected && /\/login|\/d2l\/lp\/auth|saml|sso|shibboleth/i.test(String(r.url || "")) ? " (sign-in page)" : "");
        if (r.ok) {
          const html = (await r.text()).slice(0, 3000000);
          // A quiz on the Quizzes page that the quiz list API left out (some schools don't give students that API): read it from its own pages
          const known = new Set(quizzes.map(x => x && String(x.QuizId)));
          for (const m of html.matchAll(/quiz_summary\.d2l\?[^"'<>]*?\bqi=(\d+)[^>]*>([\s\S]{0,600}?)<\/a>/gi)) {
            const name = htmlText(m[2], { line: true }).slice(0, 300);
            if (!name || known.has(m[1]) || qrecent.length >= 40) continue;
            known.add(m[1]); qOnlyPage++;
            const x = { QuizId: Number(m[1]), Name: name, IsActive: true, fromPage: true };
            quizzes.push(x); qrecent.push(x);
          }
          html.split(/(?=[?&;]qi=\d)/).slice(1).forEach(part => {
            const m = part.match(/^[?&;]qi=(\d+)/); if (!m) return; qLinks++; if (tried[m[1]] === true) return;
            const all = [...htmlText(part.slice(0, 6000), { line: true }).matchAll(/(?<![\d/])(\d+)\s*\/\s*(?:\d+|unlimited)(?![\d/])/gi)], a = all[all.length - 1];
            if (a && Number(a[1]) > 0) { tried[m[1]] = true; qPage++; }
          });
        }
      } catch (e) { qPageStatus = String(e && e.name || "error"); }
    }
    const qLeft = qrecent.filter(x => tried[x.QuizId] !== true).slice(0, 12);
    const pageSeen = {};
    const page = async u => {
      try {
        const r = await fetch(u, { credentials: "include" });
        const login = !!(r.redirected && /\/login|\/d2l\/lp\/auth|saml|sso|shibboleth/i.test(String(r.url || "")));
        if (!r.ok || login) { pageSeen[u] = login ? "sign-in page" : "HTTP " + r.status; return ""; }
        const t = htmlText((await r.text()).slice(0, 1500000), { line: true });
        pageSeen[u] = "ok " + t.length + " chars" + (/\b(log ?in|sign ?in)\b[^.]{0,40}\b(password|username|user name)\b/i.test(t.slice(0, 4000)) ? ", looks like a sign-in page" : "");
        return t;
      } catch (e) { pageSeen[u] = "failed: " + (e && (e.name || e.message) || "error"); return ""; }
    };
    const submPage = {};
    await inBatches(qLeft, async x => {
      if (!spend()) return;
      const sum = await page(`/d2l/lms/quizzing/user/quiz_summary.d2l?qi=${x.QuizId}&ou=${c.ou}`);
      const done = sum.match(/\bcompleted\s*[-–:]\s*(\d+)(?![\d/:.,])/i);
      if (done && Number(done[1]) > 0) { tried[x.QuizId] = true; qOwn++; return; }
      const subm = submPage[x.QuizId] = await page(`/d2l/lms/quizzing/user/quiz_submissions.d2l?qi=${x.QuizId}&ou=${c.ou}`);
      if (/\battempt\s+\d+\b/i.test(subm)) { tried[x.QuizId] = true; qOwn++; }
    });
    // Marks that aren't on the Grades page. Each source below fills `marks` ({kind, id, num, den, from, how}) for items Grades has no mark for;
    // the app keeps Grades first, then these in the order of MARK_SOURCES in src/js/95-lms.js. Each can be switched off (q.marks[source] === false).
    const markOn = k => !(q.marks && typeof q.marks === "object" && q.marks[k] === false) && q.grades !== false;
    const gradeRows = listOf(grades), hasMark = id => id != null && gradeRows.some(g => g && String(g.GradeObjectIdentifier) === String(id) && g.PointsNumerator != null);
    const marks = [], markNote = [], mk = (kind, id, sc, from) => { if (sc && sc.den > 0 && sc.num != null && sc.num >= 0 && sc.num <= sc.den * 2) marks.push({ kind, id: String(id), num: sc.num, den: sc.den, from, how: sc.how || "" }); };
    const num = v => { const x = Number(v); return v != null && v !== "" && isFinite(x) ? x : null; };
    // "34 / 45" after a label (Score, Grade, Overall Grade...). With `den`, only that denominator counts, so a date or a post's "3/4" isn't taken for a mark
    const labelled = (t, den) => {
      for (const m of String(t || "").matchAll(/\b(overall\s+grade|score|grade|mark|points|assessment|evaluation)\b[^\n\d]{0,40}?(?<![\d/.])(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?![\d/])/gi)) {
        const n = num(m[2]), d = num(m[3]); if (n == null || !(d > 0) || (den > 0 && d !== den)) continue;
        return { num: n, den: d, how: (m[0].match(/\(([^)]{1,30})\)/) || [])[1] || "" };
      }
      return null;
    };
    // 1. Quizzes: the quiz's Submissions page (Quizzes > the quiz > Submissions): "Overall Grade (highest attempt): 34 / 45", or the best attempt
    if (markOn("quizPage")) {
      const scoreOf = t => {
        const over = t.match(/\boverall\s+grade\b[^:\n]{0,40}:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/i);
        if (over && num(over[2]) > 0) return { num: num(over[1]), den: num(over[2]), how: (over[0].match(/\(([^)]{1,30})\)/) || [])[1] || "" };
        const rows = [...t.matchAll(/\battempt\s+(\d+)\b[^\n]{0,80}?(?<![\d/])(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?![\d/])/gi)].map(m => ({ num: num(m[2]), den: num(m[3]) })).filter(x => x.den > 0 && x.num != null && x.num <= x.den * 2);
        if (!rows.length) return null;
        const best = rows.sort((a, b) => b.num / b.den - a.num / a.den)[0];
        return { num: best.num, den: best.den, how: rows.length > 1 ? "highest attempt" : "" };
      };
      const toScore = qrecent.filter(x => tried[x.QuizId] !== false && !hasMark(x.GradeItemId)).sort((a, b) => (tried[b.QuizId] === true) - (tried[a.QuizId] === true)).slice(0, 15);
      let got = 0;
      await inBatches(toScore, async x => {
        if (!spend()) return;
        const t = submPage[x.QuizId] != null ? submPage[x.QuizId] : (submPage[x.QuizId] = await page(`/d2l/lms/quizzing/user/quiz_submissions.d2l?qi=${x.QuizId}&ou=${c.ou}`));
        const sc = t && scoreOf(t); if (sc) { mk("quiz", x.QuizId, sc, "quizPage"); got++; tried[x.QuizId] = true; }
        if (t && x.fromCal) { const nm = t.match(/\bquiz submissions\s*[-–:]\s*(.{3,160}?)\s+(?:individual attempts|attempt\s+\d|overall grade|there are no|no submissions)/i); if (nm) x.Name = nm[1].trim(); if (/\battempt\s+\d+\b/i.test(t)) tried[x.QuizId] = true; }
      });
      if (toScore.length) markNote.push(`quiz Submissions pages ${got} of ${toScore.length}`);
    }
    // 2. Assignments: the score in the assignment's published feedback (Assignments > the assignment > View Feedback)
    const outOfF = f => f && f.Assessment && num(f.Assessment.ScoreDenominator) > 0 ? num(f.Assessment.ScoreDenominator) : null;
    const fUnmarked = fl.filter(f => !hasMark(f.GradeItemId));
    const fx = {}; const fxOf = f => fx[f.Id] = fx[f.Id] || { id: String(f.Id), n: String(f.Name || "").slice(0, 70), sub: subs[f.Id] === true ? "yes" : subs[f.Id] === false ? "no" : "unknown", gradeItem: f.GradeItemId != null ? String(f.GradeItemId) : "", inGrades: hasMark(f.GradeItemId), outOf: outOfF(f), fb: fbk[f.Id] ? (fbk[f.Id].Score != null ? "score " + fbk[f.Id].Score : "no score") : "none" };
    const tryGetS = async u => { try { return { b: await get(u) }; } catch (e) { return { e: String(e.status || e.name || e.message || "error") }; } };
    const meIdent = String(me.Identifier || "");
    const handedIn = f => subs[f.Id] === true || !!fbk[f.Id];
    if (markOn("assignmentFeedback")) {
      let got = 0;
      fUnmarked.forEach(f => { const fe = fbk[f.Id], sc = fe && num(fe.Score), den = outOfF(f); if (sc != null && den) { mk("folder", f.Id, { num: sc, den }, "assignmentFeedback"); got++; } });
      // the feedback link for you, for handed-in ones the submissions answer had no score for
      const ask = fUnmarked.filter(f => handedIn(f) && !marks.some(m => m.kind === "folder" && m.id === String(f.Id))).slice(0, 15);
      if (meIdent) await inBatches(ask, async f => {
        if (!spend()) return;
        const r = await tryGetS(`${b}/dropbox/folders/${f.Id}/feedback/user/${meIdent}`), x = fxOf(f);
        if (r.e) { x.fbApi = "refused (" + r.e + ")"; return; }
        const fe = r.b && typeof r.b === "object" ? r.b : null, sc = fe && num(fe.Score), den = outOfF(f) || (fe && fe.OutOf != null ? num(fe.OutOf) : null);
        x.fbApi = fe ? "ok" + (sc != null ? ", score " + sc : ", no score") + (fe.IsGraded === false ? ", not graded" : "") : "empty";
        if (fe && !fbk[f.Id]) fbk[f.Id] = fe;
        if (sc != null && den) { mk("folder", f.Id, { num: sc, den }, "assignmentFeedback"); got++; }
      });
      if (got) markNote.push(`assignment feedback ${got}`);
    }
    // 3. Assignments: the Assignments page's Score column (by its heading), else the assignment's View Feedback page, for handed-in ones still without a mark
    if (markOn("assignmentsPage") && spend()) {
      const left = fUnmarked.filter(f => handedIn(f) && !marks.some(m => m.kind === "folder" && m.id === String(f.Id)));
      if (left.length) {
        if (folderHtml == null) { try { const r = await fetch(`/d2l/lms/dropbox/user/folders_list.d2l?ou=${c.ou}&isprv=0`, { credentials: "include" }); folderHtml = r.ok ? (await r.text()).slice(0, 3000000) : ""; } catch (e) { folderHtml = ""; } }
        const cellsOf = row => [...String(row).matchAll(/<(t[hd])\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi)].map(m => ({ t: htmlText(m[3], { line: true }), span: Number((m[2].match(/colspan\s*=\s*["']?(\d+)/i) || [])[1]) || 1 }));
        const expand = cs => { const o = []; cs.forEach(c2 => { o.push(c2.t); for (let k = 1; k < Math.min(c2.span, 8); k++) o.push(""); }); return o; };
        const scoreIn = t => { const m = String(t || "").match(/(?<![\d/.])(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?![\d/])/); return m && num(m[2]) > 0 ? { num: num(m[1]), den: num(m[2]) } : null; };
        const rowOf = {}; let scoreCol = -1;
        String(folderHtml).split(/<tr\b/i).slice(1).forEach(raw => {
          const cs = expand(cellsOf(raw)), low = cs.map(x => x.toLowerCase());
          if (scoreCol < 0 && low.some(x => /^score$/.test(x))) { scoreCol = low.findIndex(x => /^score$/.test(x)); return; }
          const m = raw.match(/[?&;](?:amp;)?db=(\d+)/); if (!m || rowOf[m[1]]) return;
          rowOf[m[1]] = { text: htmlText(raw, { line: true }).slice(0, 240), score: scoreCol >= 0 ? cs[scoreCol] || "" : "",
            links: [...raw.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(x => x[1].replace(/&amp;/g, "&")).filter(h => /feedback|history|folder_user/i.test(h)).slice(0, 3) };
        });
        let got = 0;
        await inBatches(left, async f => {
          const row = rowOf[String(f.Id)], den = outOfF(f), x = fxOf(f);
          x.row = row ? row.text : "not on the page"; x.scoreCell = row ? row.score : ""; x.links = row ? row.links : [];
          let sc = row && row.score ? scoreIn(row.score) : null;
          if (!sc && row && den) { const all = [...row.text.matchAll(/(?<![\d/.])(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?![\d/])/g)].map(m => ({ num: num(m[1]), den: num(m[2]) })); sc = all.find(y => y.den === den) || null; }
          if (!sc && row) sc = labelled(row.text, den);
          // its View Feedback page: the score after "Score" there
          if (!sc && row && row.links.length && spend()) { const fu = row.links[0].charAt(0) === "/" ? row.links[0] : "/d2l/lms/dropbox/user/" + row.links[0]; const t = await page(fu); x.fbPage = (pageSeen[fu] || "") + (t ? `, "score" ${(t.match(/\bscore\b/gi) || []).length}x` : ""); sc = t ? (labelled(t, den) || (den ? null : scoreIn((t.match(/\bscore\b[^\n]{0,60}/i) || [""])[0]))) : null; }
          if (sc && (!den || sc.den === den)) { mk("folder", f.Id, sc, "assignmentsPage"); got++; }
        });
        markNote.push(`Assignments page ${got} of ${left.length}`);
      }
    }
    if (qrecent.length) {
      const sat = qrecent.filter(x => tried[x.QuizId] === true).length, not = qrecent.filter(x => tried[x.QuizId] === false).length;
      c.quizNote = `quizzes: ${sat} sat, ${not} not, ${qrecent.length - sat - not} unknown` + (qOnlyPage ? `; ${qOnlyPage} only on the Quizzes page` : "") + (qRefused ? `; attempts API refused ${qRefused}` : "") + (qPageStatus ? `; Quizzes page ${qPageStatus}, ${qLinks} quiz links, ${qPage} sat from it` : "") + (qLeft.length ? `; ${qOwn} of ${qLeft.length} sat from their own pages` : "");
    }
    const graded = new Set(listOf(grades).filter(g => g && g.GradeObjectIdentifier != null && g.PointsNumerator != null).map(g => String(g.GradeObjectIdentifier)));
    const rubOf = r => {
      if (!r || !Array.isArray(r.CriteriaGroups)) return null;
      const cr = [];
      r.CriteriaGroups.forEach(g => { const lv = g.Levels || []; (g.Criteria || []).forEach(x => { if (cr.length < 15) cr.push({ id: String(x.Id || ""), t: txt(x.Name, 200), d: "",
        pts: Math.max(0, ...(x.Cells || []).map(y => Number(y && y.Points) || 0), ...lv.map(y => Number(y && y.Points) || 0)),
        lv: (x.Cells || []).slice(0, 6).map((y, i) => ({ id: String(lv[i] && lv[i].Id || ""), t: txt(lv[i] && lv[i].Name, 80), d: txt(y && y.Description, 160), pts: Number(y && y.Points != null ? y.Points : lv[i] && lv[i].Points) || 0 })) }); }); });
      return cr.length ? { name: txt(r.Name, 120) || "Rubric", pts: null, cr } : null;
    };
    const fbOf = (fe, rub, of) => {
      if (!fe) return null;
      const t = txt(fe.Feedback, 3000), ra = [];
      (fe.RubricAssessments || []).forEach(a => (a && a.CriteriaOutcome || []).slice(0, 15).forEach(o => {
        const cr = rub && rub.cr.find(x => x.id === String(o.CriterionId)), lv = cr && cr.lv.find(x => x.id === String(o.LevelId));
        ra.push({ c: cr ? cr.t : "", pts: o.Score != null ? Number(o.Score) : null, of: cr ? cr.pts : null, lv: lv ? lv.t : "", t: txt(o.Feedback, 600) });
      }));
      const sc = fe.Score != null ? Number(fe.Score) : null;
      if (!t && !ra.length && sc == null) return null;
      return { c: t ? [{ by: "Instructor", mine: false, at: null, t }] : [], ra, sc, of, g: String(fe.GradedSymbol || "").slice(0, 20), at: null };
    };
    const stOf = (due, end, sub, at) => sub == null && !at ? null : { subAt: at || null, late: !!(at && due && Date.parse(at) > Date.parse(due) + 60000), missing: sub === false && !!due && Date.parse(due) < now && !(end && Date.parse(end) > now), excused: false, ext: false };
    c.folders = fl.slice(0, 120).map(f => ({ id: String(f.Id), name: String(f.Name || ""), due: dt(f.DueDate), start: dt(f.Availability && f.Availability.StartDate), end: dt(f.Availability && f.Availability.EndDate),
      text: txt(f.CustomInstructions), files: (f.Attachments || []).slice(0, 12).map(a => ({ id: String(a.FileId), name: String(a.FileName || "file"), size: Number(a.Size) || 0 })),
      gid: f.GradeItemId != null ? String(f.GradeItemId) : "", outOf: f.Assessment && f.Assessment.ScoreDenominator != null ? Number(f.Assessment.ScoreDenominator) : null, sub: subs[f.Id] === true || (f.GradeItemId != null && graded.has(String(f.GradeItemId))) ? true : subs[f.Id] === undefined ? null : subs[f.Id],
      sbt: f.SubmissionType != null && Number(f.SubmissionType) >= 0 && Number(f.SubmissionType) <= 9 ? Number(f.SubmissionType) : null,
      rub: rubOf(f.Assessment && Array.isArray(f.Assessment.Rubrics) ? f.Assessment.Rubrics[0] : null),
      st: stOf(dt(f.DueDate), dt(f.Availability && f.Availability.EndDate), subs[f.Id] === true || (f.GradeItemId != null && graded.has(String(f.GradeItemId))) ? true : subs[f.Id] === undefined ? null : subs[f.Id], subAt[f.Id]) }));
    c.folders.forEach(f => { const fe = fbk[f.id]; if (fe) f.fb = fbOf(fe, f.rub, f.outOf); });
    c.quizzes = quizzes.filter(x => x && x.IsActive !== false).slice(0, 120).map(x => ({ id: String(x.QuizId), name: String(x.Name || ""), due: dt(x.DueDate), start: dt(x.StartDate), end: dt(x.EndDate),
      gid: x.GradeItemId != null ? String(x.GradeItemId) : "", text: txt(x.Description || x.Instructions, 1500), limit: x.TimeLimitValue || (x.TimeLimit && x.TimeLimit.TimeLimitValue) || null,
      done: tried[x.QuizId] === true || (x.GradeItemId != null && graded.has(String(x.GradeItemId))) ? true : tried[x.QuizId] === undefined ? null : false,
      at: satAt[x.QuizId] || null }));
    c.quizzes.forEach(x => { x.st = stOf(x.due, x.end, x.done, null); });
    c.gradeN = listOf(grades).length;
    c.grades = listOf(grades).slice(0, 200).map(g => ({ gid: String(g.GradeObjectIdentifier || ""), name: String(g.GradeObjectName || ""), type: Number(g.GradeObjectType) || 0,
      num: g.PointsNumerator, den: g.PointsDenominator, wnum: g.WeightedNumerator, wden: g.WeightedDenominator, shown: String(g.DisplayedGrade || "").trim(), at: dt(g.ReleasedDate || g.LastModified),
      fb: txt(g.Comments, 3000) ? { c: [{ by: "Instructor", mine: false, at: dt(g.ReleasedDate || g.LastModified), t: txt(g.Comments, 3000) }], ra: [], sc: g.PointsNumerator != null ? Number(g.PointsNumerator) : null, of: g.PointsDenominator != null ? Number(g.PointsDenominator) : null, g: String(g.DisplayedGrade || "").trim().slice(0, 20), at: null } : null }));
    const marked = c.grades.filter(g => g.gid && !/^gp\d/.test(g.gid) && g.num != null).slice(0, 25);
    if (marked.length) {
      const num = v => v != null && isFinite(Number(v)) ? Number(v) : null;
      const statsOf = async g => { if (!spend()) return false; const r = await soft(`${b}/grades/${g.gid}/statistics`, true); if (r && num(r.Average) != null) g.cls = { mean: num(r.Average), median: num(r.Median), lo: num(r.Minimum), hi: num(r.Maximum) }; return !!r; };
      if (await statsOf(marked[0])) await inBatches(marked.slice(1), statsOf);
    }
    try {
      const FAIL = /^(f|fail|failed|failing|e|np|not\s*pass(ed)?|nc|no\s*credit|u|unsatisfactory|insufficient)$/i;
      const setup = await soft(`${b}/grades/setup/`, true);
      let sid = setup && (setup.DefaultGradeSchemeId != null ? setup.DefaultGradeSchemeId : null);
      const finId = fin && fin.GradeObjectIdentifier;
      if (sid == null && finId) { const fo = await soft(`${b}/grades/${finId}`, true); if (fo && fo.GradeSchemeId != null) sid = fo.GradeSchemeId; }
      const sch = sid != null ? await soft(`${b}/grades/schemes/${sid}`, true) : null;
      const rg = (sch && Array.isArray(sch.Ranges) ? sch.Ranges : []).map(r => ({ sym: String(r.Symbol || "").trim(), at: Number(r.PercentStart) })).filter(r => r.sym && isFinite(r.at)).sort((x, y) => x.at - y.at);
      const pass = rg.find(r => !FAIL.test(r.sym));
      if (rg.some(r => FAIL.test(r.sym)) && pass && pass.at >= 30 && pass.at <= 90) c.passMark = { pct: Math.round(pass.at * 10) / 10, from: "scheme", name: String(sch.Name || "").slice(0, 80) };
    } catch (e) {}
    const meId = String(me.Identifier || ""), meName = [me.FirstName, me.LastName].filter(Boolean).join(" ").trim().toLowerCase();
    const tops = [];
    // Every forum's topics (Brightspace lists the oldest first), then the ones nearest today: a weekly topic from yesterday must not be cut off
    await inBatches(listOf(forums).filter(f => f && !f.IsHidden).slice(0, 40), async f => {
      const ts = await soft(`${b}/discussions/forums/${f.ForumId}/topics/`, true);
      listOf(ts).forEach(t => { if (!t || t.IsHidden) return; const d = t.DueDate || t.EndDate || t.UnlockEndDate; if (!d || inWin(d)) tops.push({ f, t, at: d ? Date.parse(d) : NaN }); });
    });
    tops.sort((x, y) => (isNaN(x.at) - isNaN(y.at)) || Math.abs(x.at - now) - Math.abs(y.at - now));
    tops.splice(40);
    c.discussions = []; let postsRefused = 0, pageChecks = 0, fromTopicPage = 0;
    const topicDx = [];
    await inBatches(tops, async ({ f, t }) => {
      const gid = t.GradeItemId != null ? String(t.GradeItemId) : "";
      let posted = gid && graded.has(gid) ? true : null;
      let postAt = null, others = 0;
      // a group topic (one shared with your group): a post by a group member is your group's post
      const grp = t.GroupTypeId != null || /\bgroups?\b/i.test(String(t.Name || ""));
      const tx = { id: String(t.TopicId), n: String(t.Name || "").slice(0, 70), forum: String(f.Name || "").slice(0, 70), due: String(t.DueDate || t.EndDate || t.UnlockEndDate || "").slice(0, 10), grp, graded: !!(gid && graded.has(gid)), posts: "not read", n0: 0, ids: [], page: "" };
      const dueAt0 = Date.parse(t.DueDate || t.EndDate || t.UnlockEndDate || ""), near = isNaN(dueAt0) || (dueAt0 > now - 45 * 864e5 && dueAt0 < now + 14 * 864e5);
      if (posted == null && meId && !near) tx.posts = "not read (not due near now)";
      else if (posted == null && meId && !spend()) tx.posts = "not read (out of time)";
      else if (posted == null && meId) {
        // all of the topic's posts, page by page (a busy class topic can run past one page), until one of yours turns up
        let prevFirst = null;
        for (let pg = 1; pg <= 6; pg++) {
          const tryGet = async u => { try { return { b: await get(u) }; } catch (e) { return { e: String(e.status || e.name || "error") }; } };
          // the documented link first; a further page only when the first one looks full
          let ans = pg === 1 ? await tryGet(`${b}/discussions/forums/${f.ForumId}/topics/${t.TopicId}/posts/`) : await tryGet(`${b}/discussions/forums/${f.ForumId}/topics/${t.TopicId}/posts/?pageSize=100&pageNumber=${pg}`);
          if (ans.e && pg === 1) { const a2 = await tryGet(`${b}/discussions/forums/${f.ForumId}/topics/${t.TopicId}/posts/?pageSize=100&pageNumber=1`); if (!a2.e) ans = a2; else ans.e += ", paged " + a2.e; }
          const ps = ans.b || null;
          if (!ps) { if (pg === 1) { postsRefused++; tx.posts = "refused (" + ans.e + ")"; } break; }
          const l = listOf(ps);
          if (pg > 1 && l.length && prevFirst != null && l[0] && l[0].PostId === prevFirst) break;
          prevFirst = l[0] ? l[0].PostId : null;
          tx.posts = "read"; tx.n0 += l.length; if (tx.ids.length < 3) l.slice(0, 3 - tx.ids.length).forEach(p => tx.ids.push(p ? typeof p.PostingUserId + ":" + String(p.PostingUserId) : "?"));
          // yours by your user id, or by your name where a school's posts give the id in another form
          const mine = l.filter(p => p && (String(p.PostingUserId) === meId || (meName && String(p.PostingUserDisplayName || "").trim().toLowerCase() === meName)));
          others += l.filter(p => p && p.PostingUserId != null && !mine.includes(p)).length;
          if (mine.length) { posted = true; postAt = mine.map(p => dt(p.DatePosted)).filter(Boolean).sort()[0] || null; break; }
          posted = false;
          if (l.length < 100 || !spend()) break;
        }
      }
      // The topic's own page says "Anna Bulawski posted Oct 25, 2026": for a recent topic the posts list didn't show (or refused) a post of yours
      const dueAt = Date.parse(t.DueDate || t.EndDate || t.UnlockEndDate || "");
      if (posted !== true && meName && pageChecks < 12 && (tx.posts.startsWith("refused") || posted == null) && near && spend() && (isNaN(dueAt) || (dueAt > now - 30 * 864e5 && dueAt < now + 14 * 864e5))) {
        pageChecks++;
        const pu = `/d2l/le/${c.ou}/discussions/topics/${t.TopicId}/View`, pt = await page(pu);
        tx.page = (pageSeen[pu] || "") + (pt ? `, "posted" ${(pt.match(/\bposted\b/gi) || []).length}x, your name ${pt.toLowerCase().includes(meName) ? "found" : "not found"}` : "");
        const esc = meName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
        const m = pt && pt.match(new RegExp(esc + "\\s+posted\\b\\s*(?:on\\s+)?([A-Z][a-z]{2,8}\\.?\\s+\\d{1,2},\\s*\\d{4}(?:\\s+\\d{1,2}:\\d{2}\\s*[AP]M)?)?", "i"));
        if (m) { posted = true; fromTopicPage++; if (!postAt && m[1] && !isNaN(Date.parse(m[1].replace(/\./, "")))) postAt = new Date(Date.parse(m[1].replace(/\./, ""))).toISOString(); }
        else if (pt && /\bposted\b/i.test(pt)) { if (posted == null) posted = false; others += (pt.match(/\bposted\b/gi) || []).length; }
      }
      tx.result = posted === true ? "posted" : posted === false ? (grp && others > 0 ? "group posted" : "not posted") : "unknown";
      topicDx.push(tx);
      const due = dt(t.DueDate) || dt(t.EndDate) || dt(t.UnlockEndDate);
      c.discussions.push({ id: String(t.TopicId), name: String(t.Name || ""), forum: String(f.Name || "").slice(0, 160), due, start: dt(t.StartDate) || dt(t.UnlockStartDate), text: txt(t.Description, 1500), gid, outOf: t.ScoreOutOf != null ? Number(t.ScoreOutOf) : null, posted, at: postAt, group: grp, groupPosted: grp && posted === false && others > 0,
        st: stOf(due, null, posted, null) });
    });
    if (tops.length) c.topicNote = `discussions: ${c.discussions.filter(d => d.posted === true).length} posted` + (c.discussions.some(d => d.groupPosted) ? ` (+${c.discussions.filter(d => d.groupPosted).length} by your group)` : "") + `, ${c.discussions.filter(d => d.posted === false && !d.groupPosted).length} not, ${c.discussions.filter(d => d.posted == null).length} unknown of ${tops.length} topics` + (postsRefused ? `; posts refused for ${postsRefused}` : "") + (fromTopicPage ? `; ${fromTopicPage} from the topic's page` : "");
    // 4. Discussions: the topic's own page, for a posted topic with a mark out of its known total (only "x / that total" after a label counts)
    if (markOn("discussionPage") && spend()) {
      const left = c.discussions.filter(d => d.posted === true && d.outOf > 0 && !hasMark(d.gid || null)).slice(0, 10);
      let got = 0;
      await inBatches(left, async d => { const sc = labelled(await page(`/d2l/le/${c.ou}/discussions/topics/${d.id}/View`), d.outOf); if (sc) { mk("topic", d.id, sc, "discussionPage"); got++; } });
      if (left.length) markNote.push(`discussion pages ${got} of ${left.length}`);
    }
    c.marks = marks.slice(0, 120);
    // What this read saw, step by step, for the sync report (Settings > Brightspace > Copy Sync Report)
    c.dx = { folders: fl.filter(f => handedIn(f) || fx[f.Id]).slice(0, 25).map(f => Object.assign(fxOf(f), { mark: (marks.find(m => m.kind === "folder" && m.id === String(f.Id)) || {}).num != null ? marks.find(m => m.kind === "folder" && m.id === String(f.Id)).num + "/" + marks.find(m => m.kind === "folder" && m.id === String(f.Id)).den : "" })), grades: gx, calTied, calExams, quizToc: qFromToc, quizCal: qFromCal, timeLeft: Math.round((budgetEnd - Date.now()) / 1000) + " s", skipped: outOfTime, me: { id: meId ? typeof me.Identifier + ":" + meId : "none", name: meName ? "yes" : "no" }, quizApi: quizApiN, quizPage: qPageStatus || "not read",
      quizzes: qrecent.slice(0, 15).map(x => { const su = `/d2l/lms/quizzing/user/quiz_submissions.d2l?qi=${x.QuizId}&ou=${c.ou}`, st = submPage[x.QuizId] || "", mm = marks.find(m => m.kind === "quiz" && m.id === String(x.QuizId));
        return { id: String(x.QuizId), n: String(x.Name || "").slice(0, 70), from: x.fromCal ? "its calendar entry" : x.fromToc ? "the course content" : x.fromPage ? "Quizzes page" : "quiz list", gradeItem: x.GradeItemId != null ? String(x.GradeItemId) : "", inGrades: hasMark(x.GradeItemId),
          sat: tried[x.QuizId] === true ? "yes" : tried[x.QuizId] === false ? "no" : "unknown", subm: pageSeen[su] || "not read",
          overall: /\boverall\s+grade\b/i.test(st), attempts: (st.match(/\battempt\s+\d+/gi) || []).length, fractions: (st.match(/\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?/g) || []).slice(0, 4).join(" | "),
          mark: mm ? mm.num + "/" + mm.den : "" }; }),
      topics: topicDx.slice(0, 30) };
    if (markNote.length) c.markNote = "marks not in Grades, from: " + markNote.join(", ");
    const STAFF = /instructor|teacher|professor|lecturer|faculty|\bta\b|teaching assistant|tutor|course leader/i;
    c.staff = listOf(roster).filter(u => u && STAFF.test(String(u.ClasslistRoleDisplayName || u.RoleName || ""))).slice(0, 8)
      .map(u => ({ name: String(u.DisplayName || [u.FirstName, u.LastName].filter(Boolean).join(" ")).slice(0, 120), email: String(u.Email || "").slice(0, 160), role: /\bta\b|assistant|tutor/i.test(String(u.ClasslistRoleDisplayName || "")) ? "TA" : "Instructor" }));
    let syl = over ? txt(over.Description, 24000) : "", sylUrl = "";
    const topics = []; const walk = (ms, d) => (ms || []).forEach(m => { if (!m || d > 4) return; (m.Topics || []).forEach(t => topics.push(t)); walk(m.Modules, d + 1); });
    walk(toc && toc.Modules, 0);
    const sylTopic = topics.find(t => t && /syllabus|course outline|course information/i.test(String(t.Title || "")));
    if (sylTopic) {
      sylUrl = `${location.origin}/d2l/le/content/${c.ou}/viewContent/${sylTopic.TopicId}/View`;
      const u = String(sylTopic.Url || "");
      if (/\.html?($|\?)/i.test(u) && u.charAt(0) === "/") { try { const r = await fetch(u, { credentials: "include" }); if (r.ok) { const page = htmlText(await r.text(), { max: 24000 }); if (page.length > syl.length) syl = page; } } catch (e) {} }
    }
    c.syl = syl ? [syl.slice(0, 8000), syl.slice(8000, 16000), syl.slice(16000, 24000)].filter(Boolean) : [];
    c.sylUrl = sylUrl;
    c.final = fin && typeof fin === "object" && !Array.isArray(fin) ? { num: fin.PointsNumerator, den: fin.PointsDenominator, wnum: fin.WeightedNumerator, wden: fin.WeightedDenominator, shown: String(fin.DisplayedGrade || "").trim() } : null;
    c.news = listOf(news).filter(n => n && n.IsPublished !== false && !n.IsHidden).slice(0, 25).map(n => ({ id: String(n.Id), title: String(n.Title || ""), text: txt(n.Body, 3000), date: dt(n.StartDate) || dt(n.CreatedDate) || dt(n.LastModifiedDate),
      files: (n.Attachments || []).length }));
    c.events = events.filter(e => e && (e.OrgUnitId == null || String(e.OrgUnitId) === String(c.ou))).slice(0, 400).map(e => ({ ou: e.OrgUnitId != null ? String(e.OrgUnitId) : "", id: String(e.CalendarEventId), title: String(e.Title || ""), text: txt(e.Description, 1500), start: dt(e.StartDateTime), end: dt(e.EndDateTime), allDay: !!e.IsAllDayEvent,
      where: String(e.LocationName || ""), assoc: !!(e.IsAssociatedWithEntity || (e.AssociatedEntity && e.AssociatedEntity.AssociatedEntityId)), kind: e.AssociatedEntity ? String(e.AssociatedEntity.AssociatedEntityType || "") : "", eid: e.AssociatedEntity && e.AssociatedEntity.AssociatedEntityId != null ? String(e.AssociatedEntity.AssociatedEntityId) : "", url: String(e.CalendarEventViewUrl || "") }));
  };
  for (let i = 0; i < pick.length; i += 4) await Promise.all(pick.slice(i, i + 4).map(detail));

  let items = [], completions = [];
  for (let i = 0; i < pick.length; i += 50) {
    const csv = pick.slice(i, i + 50).map(c => c.ou).join(",");
    if (!csv) break;
    items.push(...await pages(`/d2l/api/le/${le}/content/myItems/?orgUnitIdsCSV=${csv}&startDateTime=${enc(fromISO)}&endDateTime=${enc(toISO)}`, true, 6));
    completions.push(...await pages(`/d2l/api/le/${le}/content/myItems/completions/?orgUnitIdsCSV=${csv}&completedFromDateTime=${enc(fromISO)}`, true, 6));
  }
  const item = x => ({ ou: String(x.OrgUnitId), id: String(x.ItemId), name: String(x.ItemName || ""), type: Number(x.ItemType), act: Number(x.ActivityType), url: String(x.ItemUrl || ""),
    due: dt(x.DueDate), start: dt(x.StartDate), end: dt(x.EndDate), done: dt(x.DateCompleted), exempt: !!x.IsExempt });
  return { ok: true, origin: location.origin, me: { name: [me.FirstName, me.LastName].filter(Boolean).join(" "), id: String(me.Identifier || "") }, lp, le,
    all: all.map(c => ({ ou: c.ou, code: c.code, name: c.name, start: c.start, end: c.end })), courses: pick, items: items.slice(0, 800).map(item), completions: completions.slice(0, 800).map(item),
    errors: errors.slice(0, 30), ms: Date.now() - T0 };
}

// Canvas: read everything (runs inside a hidden Canvas page, so your sign-in applies)
async function cvHarvest(o) {
  const q = o || {}, now = Date.now(), T0 = now;
  const fromISO = new Date(now - (q.pastDays || 60) * 864e5).toISOString();
  const toISO = new Date(now + (q.aheadDays || 240) * 864e5).toISOString();
  const enc = encodeURIComponent, errors = [];
  let inFlight = 0, calmUntil = 0; const waiting = [];
  const slot = async () => { while (inFlight >= 3) await new Promise(res => waiting.push(res)); inFlight++; const w = calmUntil - Date.now(); if (w > 0) await new Promise(res => setTimeout(res, w)); };
  const free = () => { inFlight--; const n = waiting.shift(); if (n) n(); };
  const req = async (p, tries) => {
    await slot();
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(p, { credentials: "include", headers: { Accept: "application/json" }, signal: ctl.signal });
      const left = parseFloat(r.headers.get("X-Rate-Limit-Remaining"));
      if (left < 200) calmUntil = Math.max(calmUntil, Date.now() + (left < 50 ? 3000 : 1000));
      const limited = r.status === 429 || (r.status === 403 && /rate limit/i.test(await r.clone().text().catch(() => "")));
      if (limited && (tries || 0) < 3) calmUntil = Math.max(calmUntil, Date.now() + 2000 * Math.pow(2, tries || 0));
      else {
        if (r.status === 401 || r.status === 403) { const e = new Error("denied"); e.status = r.status; throw e; }
        if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
        const link = r.headers.get("Link") || "";
        const t = await r.text();
        return { body: JSON.parse(t.replace(/^while\(1\);/, "")), next: ((link.match(/<([^>]+)>;\s*rel="next"/) || [])[1]) || null };
      }
    } finally { clearTimeout(tm); free(); }
    return req(p, (tries || 0) + 1);
  };
  const soft = async (p, quiet) => { try { return (await req(p)).body; } catch (e) { if (!quiet) errors.push(String(p).replace(/\?.*/, "").replace(/\/\d+\//g, "/#/") + " " + (e.status || e.name || e.message)); return null; } };
  const pages = async (p, quiet, max) => {
    const out = []; let url = p;
    for (let i = 0; url && i < (max || 10); i++) {
      let r; try { r = await req(url); } catch (e) { if (!quiet) errors.push(String(url).replace(/\?.*/, "") + " " + (e.status || e.message)); break; }
      if (Array.isArray(r.body)) out.push(...r.body); else break;
      url = r.next;
    }
    return out;
  };
  const txt = (h, n) => htmlText(h, { max: n || 4000 });
  const dt = x => (x && typeof x === "string" && !isNaN(Date.parse(x))) ? x : null;
  const filesIn = h => { const out = [], seen = {}; const re = /<a[^>]+href="[^"]*\/files\/(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi; let m; while ((m = re.exec(String(h || ""))) && out.length < 12) { if (seen[m[1]]) continue; seen[m[1]] = 1; out.push({ id: m[1], name: txt(m[2], 120) || "File " + m[1], size: 0 }); } return out; };

  let me;
  try { me = (await req("/api/v1/users/self")).body; } catch (e) { return e.status === 401 || e.status === 403 ? { needLogin: true } : { error: "self " + (e.status || e.message) }; }
  const all = (await pages("/api/v1/courses?enrollment_state=active&include[]=term&include[]=total_scores&per_page=100", false, 5))
    .filter(c => c && c.id != null && c.name && !c.access_restricted_by_date);
  const endOf = c => dt(c.end_at) || dt(c.term && c.term.end_at);
  const startOf = c => dt(c.start_at) || dt(c.term && c.term.start_at);
  const current = c => { const e = endOf(c), s = startOf(c); return (!e || Date.parse(e) > now - 45 * 864e5) && (!s || Date.parse(s) < now + 120 * 864e5); };
  const only = Array.isArray(q.only) && q.only.length ? new Set(q.only.map(String)) : null;
  const skip = new Set((q.skip || []).map(String));
  const pick = all.filter(c => (only ? only.has(String(c.id)) : current(c)) && !skip.has(String(c.id))).slice(0, 20);
  const courses = pick.map(c => ({ ou: String(c.id), code: String(c.course_code || ""), name: String(c.name || ""), start: startOf(c), end: endOf(c), raw: c }));

  const detail = async c => {
    const id = c.ou, raw = c.raw; delete c.raw;
    const [asg, groups, events, qzs, mySubs, info, staff] = await Promise.all([
      pages(`/api/v1/courses/${id}/assignments?include[]=submission&include[]=score_statistics&per_page=100&order_by=due_at`),
      soft(`/api/v1/courses/${id}/assignment_groups?per_page=100`, true),
      // upcoming entries on their own read, so past classes can't push them out; upcoming first, each entry once
      Promise.all([[new Date(now).toISOString(), toISO, 8], [fromISO, new Date(now).toISOString(), 3]].map(([s, e, n]) => pages(`/api/v1/calendar_events?type=event&context_codes[]=course_${id}&start_date=${enc(s)}&end_date=${enc(e)}&per_page=100`, true, n)))
        .then(([a, b]) => { const seen = new Set(); return a.concat(b).filter(x => { const k = x && x.id != null ? String(x.id) : ""; if (!x || (k && seen.has(k))) return false; if (k) seen.add(k); return true; }); }),
      pages(`/api/v1/courses/${id}/quizzes?per_page=100`, true, 3),
      pages(`/api/v1/courses/${id}/students/submissions?student_ids[]=self&include[]=submission_comments&include[]=rubric_assessment&per_page=100`, true, 4),
      soft(`/api/v1/courses/${id}?include[]=syllabus_body`, true),
      pages(`/api/v1/courses/${id}/users?enrollment_type[]=teacher&enrollment_type[]=ta&include[]=email&include[]=enrollments&per_page=50`, true, 1)
    ]);
    if (raw.grading_standard_id != null) {
      const FAIL = /^(f|fail|failed|failing|e|np|not\s*pass(ed)?|nc|no\s*credit|u|unsatisfactory|insufficient)$/i;
      const gs = await pages(`/api/v1/courses/${id}/grading_standards?per_page=50`, true, 1);
      const std = gs.find(x => x && String(x.id) === String(raw.grading_standard_id));
      const rg = (std && Array.isArray(std.grading_scheme) ? std.grading_scheme : []).map(r => ({ sym: String(r.name || "").trim(), at: Number(r.value) * 100 })).filter(r => r.sym && isFinite(r.at)).sort((x, y) => x.at - y.at);
      const pass = rg.find(r => !FAIL.test(r.sym));
      if (rg.some(r => FAIL.test(r.sym)) && pass && pass.at >= 30 && pass.at <= 90) c.passMark = { pct: Math.round(pass.at * 10) / 10, from: "scheme", name: String(std.title || "").slice(0, 80) };
    }
    const qz = {}; qzs.forEach(x => { if (x && x.id != null) qz[String(x.id)] = x; });
    const subOf = {}; mySubs.forEach(x => { if (x && x.assignment_id != null) subOf[String(x.assignment_id)] = x; });
    c.staff = staff.filter(u => u && u.name).slice(0, 8).map(u => ({ name: String(u.name || "").slice(0, 120), email: String(u.email || u.login_id && /@/.test(u.login_id) && u.login_id || "").slice(0, 160),
      role: (u.enrollments || []).some(e => e && e.type === "TeacherEnrollment") ? "Instructor" : "TA" }));
    const syl = info && info.syllabus_body ? htmlText(info.syllabus_body, { max: 24000 }) : "";
    c.syl = syl ? [syl.slice(0, 8000), syl.slice(8000, 16000), syl.slice(16000, 24000)].filter(Boolean) : [];
    c.sylUrl = `${location.origin}/courses/${id}/assignments/syllabus`;
    const rubOf = a => {
      const r = Array.isArray(a.rubric) ? a.rubric : null; if (!r || !r.length) return null;
      return { name: String((a.rubric_settings && a.rubric_settings.title) || "Rubric").slice(0, 120), pts: Number(a.rubric_settings && a.rubric_settings.points_possible) || null,
        cr: r.slice(0, 15).map(x => ({ id: String(x.id || ""), t: txt(x.description, 200), d: txt(x.long_description, 300), pts: Number(x.points) || 0,
          lv: (x.ratings || []).slice(0, 6).map(v => ({ id: String(v.id || ""), t: txt(v.description, 80), d: txt(v.long_description, 160), pts: Number(v.points) || 0 })) })) };
    };
    const fbOf = (a, s, rub) => {
      if (!s) return null;
      const cm = (s.submission_comments || []).slice(-12).map(m => ({ by: String(m.author_name || "").slice(0, 80), mine: String(m.author_id) === String(me.id), at: dt(m.created_at), t: txt(m.comment, 1500) })).filter(m => m.t);
      const ra = s.rubric_assessment && typeof s.rubric_assessment === "object" ? Object.keys(s.rubric_assessment).slice(0, 15).map(k => {
        const v = s.rubric_assessment[k] || {}, cr = rub && rub.cr.find(x => x.id === k), lv = cr && cr.lv.find(x => x.id === String(v.rating_id || ""));
        return { c: cr ? cr.t : "", pts: v.points != null ? Number(v.points) : null, of: cr ? cr.pts : null, lv: lv ? lv.t : "", t: txt(v.comments, 600) };
      }) : [];
      const ss = a.score_statistics, num = v => v != null && isFinite(Number(v)) ? Number(v) : null;
      const cls = ss && num(ss.mean) != null ? { mean: num(ss.mean), median: num(ss.median), lo: num(ss.min), hi: num(ss.max), lq: num(ss.lower_q), uq: num(ss.upper_q) } : null;
      if (!cm.length && !ra.length && s.score == null && !cls) return null;
      return { c: cm, ra, sc: s.score != null && !s.excused ? Number(s.score) : null, of: Number(a.points_possible) > 0 ? Number(a.points_possible) : null, g: s.grade != null ? String(s.grade).slice(0, 20) : "", at: dt(s.graded_at), cls };
    };
    const stOf = (a, s) => s ? { subAt: dt(s.submitted_at), late: !!s.late, missing: !!s.missing, excused: !!s.excused, ext: s.late_policy_status === "extended" } : null;
    const rxOf = a => {
      const qq = a.quiz_id != null ? qz[String(a.quiz_id)] || null : null, o = {};
      const st = (Array.isArray(a.submission_types) ? a.submission_types : []).map(x => String(x).slice(0, 24)).slice(0, 8);
      if (st.length) o.st = st;
      if (a.is_quiz_assignment || a.is_quiz_lti_assignment || a.quiz_id || st.includes("online_quiz")) o.k = "quiz"; else if (st.includes("discussion_topic")) o.k = "discussion"; else o.k = "assign";
      if (qq) { if (qq.quiz_type) o.qt = String(qq.quiz_type).slice(0, 24); if (Number(qq.time_limit) > 0) o.tl = Number(qq.time_limit); if (qq.one_question_at_a_time) o.oq = 1; if (qq.ip_filter) o.ip = 1; if (qq.require_lockdown_browser) o.ld = 1; if (qq.unlock_at) o.ul = String(qq.unlock_at); if (qq.lock_at) o.ll = String(qq.lock_at); }
      if (a.require_lockdown_browser) o.ld = 1;
      if (a.ip_filter) o.ip = 1;
      return o;
    };
    const live = asg.filter(a => a && a.published !== false);
    const gw = {}; (Array.isArray(groups) ? groups : []).forEach(g => { gw[g.id] = Number(g.group_weight) || 0; });
    const weighted = !!raw.apply_assignment_group_weights && Object.values(gw).some(x => x > 0);
    const gpts = {}; let tpts = 0; live.forEach(a => { if (!a.omit_from_final_grade && Number(a.points_possible) > 0) { gpts[a.assignment_group_id] = (gpts[a.assignment_group_id] || 0) + Number(a.points_possible); tpts += Number(a.points_possible); } });
    const wOf = a => Number(a.points_possible) > 0 && !a.omit_from_final_grade ? (weighted ? (gw[a.assignment_group_id] && gpts[a.assignment_group_id] ? Math.round(gw[a.assignment_group_id] * Number(a.points_possible) / gpts[a.assignment_group_id] * 100) / 100 : null)
      : tpts > 0 ? Math.round(Number(a.points_possible) / tpts * 10000) / 100 : null) : null;
    c.items = []; c.grades = [];
    let undated = 0;
    live.slice(0, 250).forEach(a => {
      const s = Object.assign({}, a.submission || {}, subOf[String(a.id)] || {}), hasS = !!(a.submission || subOf[String(a.id)]);
      const rub = rubOf(a), fb = hasS ? fbOf(a, s, rub) : null, st = hasS ? stOf(a, s) : null;
      const kind = a.is_quiz_assignment || a.is_quiz_lti_assignment || a.quiz_id || (a.submission_types || []).includes("online_quiz") ? "quiz" : (a.submission_types || []).includes("discussion_topic") ? "discussion" : "assignment";
      const done = hasS ? (!!s.submitted_at || ["submitted", "pending_review"].includes(s.workflow_state) || (s.workflow_state === "graded" && s.score != null) || !!s.excused) && !s.missing : null;
      const due = dt(a.due_at);
      if (due || dt(a.lock_at) || dt(a.unlock_at) || hasS && s.score != null || undated++ < 60) c.items.push({ kind, id: String(a.id), name: String(a.name || ""), due, start: dt(a.unlock_at), end: dt(a.lock_at), text: txt(a.description), url: String(a.html_url || ""), gid: String(a.id),
        outOf: Number(a.points_possible) > 0 ? Number(a.points_possible) : null, done, files: filesIn(a.description), rx: rxOf(a), st, fb, rub });
      if (Number(a.points_possible) > 0 && (hasS && s.score != null || wOf(a) != null))
        c.grades.push({ gid: String(a.id), name: String(a.name || ""), num: hasS && s.score != null && !s.excused ? Number(s.score) : null, den: Number(a.points_possible), weight: wOf(a), shown: hasS && s.grade != null ? String(s.grade) : "", at: dt(hasS && s.graded_at), fb });
    });
    const en = (raw.enrollments || []).find(e => e && (e.computed_current_score != null || e.computed_current_grade));
    c.final = en ? { shown: en.computed_current_grade ? String(en.computed_current_grade) + (en.computed_current_score != null ? ` (${en.computed_current_score}%)` : "") : en.computed_current_score + "%", pct: en.computed_current_score != null ? Number(en.computed_current_score) : null } : null;
    c.events = events.slice(0, 400).map(e => ({ id: String(e.id), title: String(e.title || ""), text: txt(e.description, 1500), start: dt(e.start_at), end: dt(e.end_at), allDay: !!e.all_day, where: String(e.location_name || ""), assoc: false, url: String(e.html_url || "") }));
    c.news = [];
  };
  for (let i = 0; i < courses.length; i += 4) await Promise.all(courses.slice(i, i + 4).map(detail));

  if (q.news !== false && courses.length) {
    const ctx = courses.map(c => "context_codes[]=course_" + c.ou).join("&");
    const ann = await pages(`/api/v1/announcements?${ctx}&start_date=${enc(new Date(now - 60 * 864e5).toISOString())}&end_date=${enc(new Date(now + 864e5).toISOString())}&per_page=50`, true, 3);
    ann.forEach(n => { const ou = String(n.context_code || "").replace("course_", ""); const c = courses.find(x => x.ou === ou); if (c && c.news.length < 25) c.news.push({ id: String(n.id), title: String(n.title || ""), text: txt(n.message, 3000), date: dt(n.posted_at) || dt(n.created_at), url: String(n.html_url || "") }); });
  }
  const plan = await pages(`/api/v1/planner/items?start_date=${enc(fromISO)}&end_date=${enc(toISO)}&per_page=100`, true, 6);
  const key = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  plan.forEach(p => {
    const c = courses.find(x => x.ou === String(p.course_id)); if (!c || !p.plannable) return;
    const t = p.plannable_type; if (!["assignment", "quiz", "discussion_topic", "wiki_page"].includes(t)) return;
    const name = String(p.plannable.title || p.plannable.name || ""); const due = dt(p.plannable.due_at) || dt(p.plannable.todo_date) || dt(p.plannable_date);
    const doneP = !!((p.submissions && (p.submissions.submitted || p.submissions.excused)) || (p.planner_override && p.planner_override.marked_complete));
    const named = c.items.filter(x => key(x.name) === key(name));
    const have = c.items.find(x => x.id === String(p.plannable_id || (p.plannable && p.plannable.assignment_id) || "")) || (named.length > 1 ? named.find(x => x.due && due && x.due.slice(0, 10) === due.slice(0, 10)) : named[0]);
    if (have) { if (doneP) have.done = true; if (!have.due && due) have.due = due; return; }
    if (!due) return;
    c.items.push({ kind: t === "quiz" ? "quiz" : t === "discussion_topic" ? "discussion" : "other", id: String(p.plannable_id), name, due, start: null, end: null, text: "", url: String(p.html_url || ""), gid: "", outOf: null, done: doneP, files: [], rx: t === "quiz" ? { k: "quiz", st: ["online_quiz"] } : undefined });
  });
  // An ungraded discussion has no submission, so the to-do list can't say you posted: look for your own reply in the topic
  // (only yours: Canvas counts each student's post, in group discussions too). Graded ones are followed by their submission.
  const meId = me && me.id != null ? String(me.id) : "", topics = [];
  courses.forEach(c => (c.items || []).forEach(x => { const d = Date.parse(x.due || ""); if (x.kind === "discussion" && !x.gid && x.done !== true && (isNaN(d) || (d > now - 45 * 864e5 && d < now + 14 * 864e5))) topics.push({ c, x }); }));
  for (let i = 0; meId && i < Math.min(topics.length, 24); i += 6) await Promise.all(topics.slice(i, Math.min(i + 6, 24)).map(async ({ c, x }) => {
    // the topic's full view has every post and reply; top-level entries are the fallback
    const v = await soft(`/api/v1/courses/${c.ou}/discussion_topics/${x.id}/view`, true), es = [];
    const walk = (list, d) => (Array.isArray(list) ? list : []).forEach(e => { if (!e || d > 8 || es.length > 3000) return; es.push(e); walk(e.replies, d + 1); });
    if (v && Array.isArray(v.view)) walk(v.view, 0); else es.push(...await pages(`/api/v1/courses/${c.ou}/discussion_topics/${x.id}/entries?per_page=100`, true, 3));
    const mine = es.filter(e => e && String(e.user_id) === meId && !e.deleted);
    if (mine.length) { x.done = true; x.at = mine.map(e => dt(e.created_at)).filter(Boolean).sort()[0] || null; x.st = { subAt: x.at, late: false, missing: false, excused: false, ext: false }; }
  }));
  const mail = [];
  if (q.mail) {
    const convs = await soft("/api/v1/conversations?scope=inbox&per_page=20", true);
    for (const cv of (Array.isArray(convs) ? convs : []).slice(0, 15)) {
      const full = await soft("/api/v1/conversations/" + enc(cv.id) + "?auto_mark_as_read=false", true); if (!full) continue;
      const who = {}; (full.participants || cv.participants || []).forEach(x => { who[x.id] = x.name; });
      mail.push({ id: String(cv.id), subject: String(full.subject || cv.subject || ""), course: String(full.context_name || cv.context_name || ""), at: String(cv.last_message_at || cv.last_authored_message_at || ""),
        unread: cv.workflow_state === "unread", names: Object.keys(who).slice(0, 8).map(k => String(who[k] || "")),
        msgs: (full.messages || []).slice(0, 20).reverse().map(m => ({ from: String(who[m.author_id] || ""), mine: String(m.author_id) === String(me.id), at: String(m.created_at || ""), body: String(m.body || "").slice(0, 6000), files: (m.attachments || []).length })) });
    }
  }
  return { ok: true, origin: location.origin, me: { name: String(me.name || ""), id: String(me.id || "") },
    all: all.map(c => ({ ou: String(c.id), code: String(c.course_code || ""), name: String(c.name || "") })), courses, errors: errors.slice(0, 30), ms: Date.now() - T0, mail };
}

// Blackboard Learn
async function bbHarvest(o) {
  const q = o || {}, now = Date.now(), T0 = now;
  // Internal endpoints (/learn/api/v1): fallbacks and rubrics, remote switch bb_internal
  const INTERNAL = q.internal !== false;
  const errors = [], enc = encodeURIComponent;
  const req = async p => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(p, { credentials: "include", headers: { Accept: "application/json" }, signal: ctl.signal });
      if (r.status === 401 || r.status === 403) { const e = new Error("denied"); e.status = r.status; throw e; }
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return await r.json();
    } finally { clearTimeout(tm); }
  };
  const first = async (paths, quiet) => { let last = null; for (const p of paths) { try { return await req(p); } catch (e) { last = e; if (e.status === 401) break; } } if (!quiet && last) errors.push(String(paths[0]).replace(/\?.*/, "").replace(/_\d+_1/g, "#") + " " + (last.status || last.message)); return null; };
  const listOf = x => Array.isArray(x) ? x : x && Array.isArray(x.results) ? x.results : [];
  const pages = async (paths, quiet, max) => {
    const r0 = await first(paths, quiet); if (!r0) return [];
    const out = listOf(r0).slice(); let next = r0.paging && r0.paging.nextPage;
    for (let i = 1; next && i < (max || 6); i++) { let r; try { r = await req(next); } catch (e) { break; } out.push(...listOf(r)); next = r.paging && r.paging.nextPage; }
    return out;
  };
  const txt = (h, n) => { if (h && typeof h === "object") h = h.rawText || h.displayText || h.text || ""; return htmlText(h, { max: n || 4000 }); };
  const dt = x => (x && typeof x === "string" && !isNaN(Date.parse(x))) ? x : null;

  let me = null;
  let lastErr = null;
  for (const p of ["/learn/api/public/v1/users/me", ...(INTERNAL ? ["/learn/api/v1/users/me"] : [])]) { try { me = await req(p); if (me && me.id) break; } catch (e) { lastErr = e; } }
  if (!me || !me.id) return !lastErr || lastErr.status === 401 || lastErr.status === 403 ? { needLogin: true } : { error: "me " + (lastErr.status || lastErr.message) };
  const uid = me.id, name = me.name ? [me.name.given, me.name.family].filter(Boolean).join(" ") : [me.givenName, me.familyName].filter(Boolean).join(" ");
  const mem = await pages([`/learn/api/public/v1/users/${uid}/courses?expand=course&limit=100`, ...(INTERNAL ? [`/learn/api/v1/users/${uid}/memberships?expand=course&limit=100`] : [])], false, 5);
  const all = mem.filter(m => m && m.course && !m.course.organization && (!m.availability || m.availability.available !== "No") && (!m.course.availability || m.course.availability.available !== "No"))
    .map(m => ({ ou: String(m.course.id), code: String(m.course.courseId || ""), name: String(m.course.name || m.course.displayName || ""), last: dt(m.lastAccessed), term: m.course.termId || "", url: String(m.course.externalAccessUrl || ""), desc: m.course.description || "" }));
  const only = Array.isArray(q.only) && q.only.length ? new Set(q.only.map(String)) : null;
  const skip = new Set((q.skip || []).map(String));

  const cal = [];
  const span = 16 * 7 * 864e5;
  for (let s = now - (q.pastDays || 60) * 864e5, k = 0; s < now + (q.aheadDays || 240) * 864e5 && k < 4; s += span, k++) {
    cal.push(...await pages([`/learn/api/public/v1/calendars/items?since=${enc(new Date(s).toISOString())}&until=${enc(new Date(s + span).toISOString())}&limit=200`], true, 4));
  }
  const busyIds = new Set(cal.map(x => String(x.calendarId || "")));
  const pick = all.filter(c => (only ? only.has(c.ou) : (busyIds.has(c.ou) || (c.last && Date.parse(c.last) > now - 120 * 864e5))) && !skip.has(c.ou))
    .sort((a, b) => (Date.parse(b.last || 0) || 0) - (Date.parse(a.last || 0) || 0)).slice(0, 20);
  const courses = pick.map(c => ({ ou: c.ou, code: c.code, name: c.name, home: c.url, desc: c.desc }));

  const detail = async c => {
    const id = c.ou;
    const desc = c.desc; delete c.desc;
    const [cols, mine, news, people, contents, rubrics, rubAssoc] = await Promise.all([
      pages([`/learn/api/public/v2/courses/${id}/gradebook/columns?limit=200`, `/learn/api/public/v1/courses/${id}/gradebook/columns?limit=200`, ...(INTERNAL ? [`/learn/api/v1/courses/${id}/gradebook/columns?limit=200`] : [])], true, 3),
      pages([`/learn/api/public/v2/courses/${id}/gradebook/users/${uid}`, `/learn/api/public/v1/courses/${id}/gradebook/users/${uid}`], true, 3),
      q.news === false ? [] : pages([`/learn/api/public/v1/courses/${id}/announcements?limit=50`, ...(INTERNAL ? [`/learn/api/v1/courses/${id}/announcements?limit=50`] : [])], true, 2),
      pages([`/learn/api/public/v1/courses/${id}/users?expand=user&limit=200`, ...(INTERNAL ? [`/learn/api/v1/courses/${id}/users?expand=user&limit=200`] : [])], true, 2),
      pages([`/learn/api/public/v1/courses/${id}/contents?limit=200`], true, 2),
      INTERNAL ? pages([`/learn/api/v1/courses/${id}/rubrics?limit=100`], true, 2) : [],
      INTERNAL ? pages([`/learn/api/v1/courses/${id}/rubricAssociations?limit=200`, `/learn/api/v1/courses/${id}/rubrics/associations?limit=200`], true, 2) : []
    ]);
    const g = {}; mine.forEach(x => { g[String(x.columnId)] = x; });
    const counts = col => !col.externalGrade && !(col.grading && col.grading.type === "Calculated") && col.includeInCalculations !== false && col.score && Number(col.score.possible) > 0;
    const tpts = cols.reduce((s, col) => s + (counts(col) ? Number(col.score.possible) : 0), 0);
    const wOf = col => counts(col) && tpts > 0 ? Math.round(Number(col.score.possible) / tpts * 10000) / 100 : null;
    const tried = {}, atWhen = {}, atFb = {}, atScore = {};
    const open = cols.filter(col => { const d = Date.parse((col.grading && col.grading.due) || ""), my = g[String(col.id)]; if (col.externalGrade || (col.grading && col.grading.type === "Calculated")) return false;
      if (isNaN(d)) return !!(col.grading && col.grading.type === "Attempts") && !(my && my.score != null);
      return d > now - (q.pastDays || 60) * 864e5 && d < now + (q.aheadDays || 240) * 864e5 && (!(my && my.score != null) || d > now - 21 * 864e5); }).slice(0, 40);
    for (let i = 0; i < open.length; i += 6) await Promise.all(open.slice(i, i + 6).map(async col => {
      const at = await first([`/learn/api/public/v2/courses/${id}/gradebook/columns/${col.id}/attempts?userId=${uid}&limit=20`, `/learn/api/public/v1/courses/${id}/gradebook/columns/${col.id}/attempts?userId=${uid}&limit=20`], true);
      if (!at) return;
      const ok = listOf(at).filter(a => a && (["NeedsGrading", "Completed", "NeedsMoreGrading"].includes(String(a.status)) || a.score != null));
      tried[String(col.id)] = ok.length > 0;
      const when = ok.map(a => dt(a.attemptDate) || dt(a.created)).filter(Boolean).sort();
      if (when.length) atWhen[String(col.id)] = when[0];
      const fbA = ok.map(a => txt(a.feedback, 3000)).filter(Boolean).pop();
      if (fbA) atFb[String(col.id)] = fbA;
      // a graded attempt's score, for when the gradebook cell is still empty (not posted to the Grades page yet)
      const sc = ok.filter(a => a.score != null && a.score !== "" && isFinite(Number(a.score)) && String(a.status) !== "NeedsGrading").map(a => Number(a.score));
      if (sc.length) atScore[String(col.id)] = Math.max(...sc);
    }));
    const rubById = {}; rubrics.forEach(r => { if (r && r.id) rubById[String(r.id)] = r; });
    const rubCol = {}; rubAssoc.forEach(a => { const col = a && (a.gradebookColumnId || a.columnId || (a.associatedEntity && a.associatedEntity.id)); const r = a && (a.rubric || rubById[String(a.rubricId || "")]); if (col && r) rubCol[String(col)] = r; });
    const rubOf = r => {
      const rows = r && (r.rubricRows || r.rows), lcols = (r && (r.rubricColumns || r.columns)) || [];
      if (!Array.isArray(rows) || !rows.length) return null;
      return { name: txt(r.title || r.name, 120) || "Rubric", pts: null, cr: rows.slice(0, 15).map(x => {
        const cells = x.rubricCells || x.cells || [];
        const lv = cells.slice(0, 6).map((y, k) => { const lc = lcols.find(z => z && String(z.id) === String(y.rubricColumnId || y.columnId)) || lcols[k] || {}; return { id: String(y.id || lc.id || ""), t: txt(lc.header || lc.title, 80), d: txt(y.description, 160), pts: Number(y.points != null ? y.points : y.maxPoints) || 0 }; });
        return { id: String(x.id || ""), t: txt(x.header || x.title, 200), d: "", pts: Math.max(0, ...lv.map(v => v.pts)), lv };
      }) };
    };
    c.staff = people.filter(m => m && /^(Instructor|TeachingAssistant)$/i.test(String(m.courseRoleId || "")) && m.user).slice(0, 8).map(m => ({
      name: (m.user.name ? [m.user.name.given, m.user.name.family].filter(Boolean).join(" ") : String(m.user.userName || "")).slice(0, 120),
      email: String((m.user.contact && m.user.contact.email) || "").slice(0, 160), role: /assistant/i.test(String(m.courseRoleId)) ? "TA" : "Instructor" })).filter(x => x.name);
    let syl = txt(desc, 24000), sylUrl = "";
    const SYL = /syllabus|course outline|course information|course overview/i;
    let hit = contents.find(x => x && SYL.test(String(x.title || "")));
    if (!hit) for (const f of contents.filter(x => x && x.hasChildren && /start here|getting started|information|overview|welcome/i.test(String(x.title || ""))).slice(0, 4)) {
      const kids = await pages([`/learn/api/public/v1/courses/${id}/contents/${f.id}/children?limit=100`], true, 1);
      hit = kids.find(x => x && SYL.test(String(x.title || ""))); if (hit) break;
    }
    if (hit) {
      sylUrl = `${location.origin}/ultra/courses/${id}/outline`;
      let body = txt(hit.body, 24000);
      if (hit.hasChildren) { const kids = await pages([`/learn/api/public/v1/courses/${id}/contents/${hit.id}/children?limit=50`], true, 1); body = [body].concat(kids.map(k => [String(k.title || ""), txt(k.body, 8000)].filter(Boolean).join("\n"))).filter(Boolean).join("\n\n").slice(0, 24000); }
      if (body.length > syl.length / 2) syl = [syl, body].filter(Boolean).join("\n\n").slice(0, 24000);
    }
    c.syl = syl ? [syl.slice(0, 8000), syl.slice(8000, 16000), syl.slice(16000, 24000)].filter(Boolean) : [];
    c.sylUrl = sylUrl;
    const courseUrl = `${location.origin}/ultra/courses/${id}/outline`;
    c.items = []; c.grades = []; c.final = null; c.marks = [];
    const markOn = k => !(q.marks && typeof q.marks === "object" && q.marks[k] === false) && q.grades !== false;
    let undatedN = 0;
    cols.forEach(col => {
      const my = g[String(col.id)] || null, due = dt(col.grading && col.grading.due), possible = col.score && Number(col.score.possible) > 0 ? Number(col.score.possible) : null;
      const score = my && (my.score != null ? Number(my.score) : my.displayGrade && my.displayGrade.score != null ? Number(my.displayGrade.score) : null);
      const shown = my && my.displayGrade ? String(my.displayGrade.text || (my.displayGrade.score != null ? my.displayGrade.score : "")) : my && my.text ? String(my.text) : "";
      if (col.externalGrade) { if (my && (shown || score != null)) c.final = { shown: shown || (possible && score != null ? Math.round(score / possible * 1000) / 10 + "%" : String(score)), pct: possible && score != null ? Math.round(score / possible * 1000) / 10 : null }; return; }
      if (col.grading && col.grading.type === "Calculated") return;
      const done = (my && (["NeedsGrading", "Graded", "Completed"].includes(String(my.status)) || score != null)) || tried[String(col.id)] === true ? true : my || tried[String(col.id)] === false ? false : null;
      const k = String(col.id), when = atWhen[k] || null, exempt = !!(my && my.exempt);
      const st = done == null && !when ? null : { subAt: when, late: !!(when && due && Date.parse(when) > Date.parse(due) + 60000), missing: done === false && !exempt && !!due && Date.parse(due) < now, excused: exempt, ext: false };
      const fbT = txt(my && my.feedback, 3000) || atFb[k] || "";
      const fb = fbT || score != null ? { c: fbT ? [{ by: "Instructor", mine: false, at: dt(my && (my.modified || my.lastModified)), t: fbT }] : [], ra: [], sc: score, of: possible, g: shown.slice(0, 20), at: null } : null;
      const rub = rubOf(rubCol[k]);
      if (due || undatedN++ < 60) c.items.push({ kind: /\b(test|quiz|exam|midterm)\b/i.test(col.name || "") ? "quiz" : "assignment", id: String(col.id), name: String(col.name || ""), due, start: null, end: null, text: txt(col.description), url: courseUrl, gid: String(col.id), outOf: possible, done, files: [], rx: col.grading && col.grading.type ? { gt: String(col.grading.type).slice(0, 16) } : undefined, st, fb, rub });
      if (score == null && possible && atScore[k] != null && !(col.availability && /^no$/i.test(String(col.availability.available || ""))) && !(col.grading && col.grading.anonymousGrading && col.grading.anonymousGrading.type && !/none/i.test(String(col.grading.anonymousGrading.type))) && atScore[k] >= 0 && atScore[k] <= possible * 2 && markOn("attemptScore")) c.marks.push({ kind: "column", id: k, num: atScore[k], den: possible, from: "attemptScore", how: "" });
      if (possible && (score != null || wOf(col) != null)) c.grades.push({ gid: String(col.id), name: String(col.name || ""), num: score, den: possible, weight: wOf(col), shown, at: dt(my && (my.modified || my.lastModified)), fb });
    });
    c.news = news.slice(0, 25).map(n => ({ id: String(n.id), title: String(n.title || ""), text: txt(n.body, 3000), date: dt(n.created) || dt(n.availability && n.availability.duration && n.availability.duration.start), url: `${location.origin}/ultra/courses/${id}/announcements` }));
    c.events = [];
  };
  for (let i = 0; i < courses.length; i += 4) await Promise.all(courses.slice(i, i + 4).map(detail));

  const key = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  cal.forEach(x => {
    const c = courses.find(y => y.ou === String(x.calendarId || "")); if (!c) return;
    const type = String(x.type || "");
    if (type === "GradebookColumn") {
      const name = String(x.title || ""), due = dt(x.end) || dt(x.start);
      const have = c.items.find(y => y.id === String(x.itemSourceId || "")) || c.items.find(y => key(y.name) === key(name));
      if (have) { if (!have.due && due) have.due = due; return; }
      if (!due) return;
      c.items.push({ kind: /\b(test|quiz|exam|midterm)\b/i.test(name) ? "quiz" : "assignment", id: String(x.itemSourceId || x.id), name, due, start: null, end: null, text: txt(x.description, 1500), url: `${location.origin}/ultra/courses/${c.ou}/outline`, gid: String(x.itemSourceId || ""), outOf: null, done: null, files: [] });
    } else if (type === "Course" || type === "OfficeHours") {
      c.events.push({ id: String(x.id), title: String(x.title || ""), text: txt(x.description, 1500), start: dt(x.start), end: dt(x.end), allDay: !!x.allDay, where: String(x.location || ""), assoc: false, url: `${location.origin}/ultra/calendar` });
    }
  });
  return { ok: true, origin: location.origin, me: { name, id: String(uid) }, all: all.map(c => ({ ou: c.ou, code: c.code, name: c.name })), courses, errors: errors.slice(0, 30), ms: Date.now() - T0 };
}

// The three platforms
// Moodle: read everything (runs inside a hidden Moodle page). Moodle has no API a student can use without the school setting
// one up, so this uses what Moodle's own pages use: its AJAX service (with the page's session key) for courses and the
// calendar, and the assignment, quiz and grade report pages for what's been submitted and the marks.
async function mdHarvest(o) {
  const q = o || {}, now = Date.now(), T0 = now, root = location.origin, enc = encodeURIComponent;
  const errors = [];
  const LOGIN = /\/login\/(index|change_password)\.php|\/auth\/|\/saml|\/sso\b|\/oauth2?\//i;
  const page = async path => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(root + path, { credentials: "include", headers: { Accept: "text/html" }, signal: ctl.signal });
      if (r.url && (new URL(r.url).origin !== root || LOGIN.test(new URL(r.url).pathname))) { const e = new Error("login"); e.login = true; throw e; }
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return await r.text();
    } finally { clearTimeout(tm); }
  };
  const doc = html => new DOMParser().parseFromString(html, "text/html");
  const quiet = async (path, what) => { try { return doc(await page(path)); } catch (e) { if (e.login) throw e; errors.push(what + " " + (e.status || e.message)); return null; } };
  const txt = (h, n) => htmlText(h || "", { max: n || 4000 });
  const num = s => { const m = String(s || "").replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/); return m ? Number(m[0].replace(",", ".")) : null; };
  const nums = s => (String(s || "").replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/g) || []).map(x => Number(x.replace(",", ".")));
  const cmOf = href => { const m = /\/mod\/([a-z0-9_]+)\/view\.php\?(?:[^#]*&)?id=(\d+)/.exec(String(href || "")); return m ? { mod: m[1], cm: m[2] } : null; };
  const iso = s => s ? new Date(Number(s) * 1000).toISOString() : null;

  // signed in? (the dashboard sends you to the sign-in page when you aren't)
  let home;
  try { home = await page("/my/"); } catch (e) { return e.login || e.status === 401 || e.status === 403 ? { needLogin: true } : { error: "home " + (e.status || e.message) }; }
  const sk = (/"sesskey":"([^"]+)"/.exec(home) || [])[1] || (typeof M !== "undefined" && M.cfg && M.cfg.sesskey) || "";
  if (!sk || /\/login\/index\.php/.test((/<form[^>]+action="([^"]+)"/.exec(home) || [])[1] || "") && !/"userid"\s*:\s*[1-9]/.test(home) && !/data-userid="[1-9]/.test(home)) return { needLogin: true };
  const call = async (methodname, args) => {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(`${root}/lib/ajax/service.php?sesskey=${enc(sk)}&info=${enc(methodname)}`, { method: "POST", credentials: "include", signal: ctl.signal,
        headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify([{ index: 0, methodname, args }]) });
      if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      const j = await r.json(), x = Array.isArray(j) ? j[0] : j;
      if (!x || x.error) { const code = String((x && x.exception && x.exception.errorcode) || (x && x.errorcode) || "ajax"); const e = new Error(code); e.login = /requirelogin|servicerequireslogin|invalidsesskey|sessionerroruser/i.test(code); throw e; }
      return x.data;
    } finally { clearTimeout(tm); }
  };

  // who
  let name = "", uid = (/data-userid="(\d+)"/.exec(home) || /"userid"\s*:\s*(\d+)/.exec(home) || [])[1] || "";
  try { const p = await quiet("/user/profile.php", "profile"); const h = p && (p.querySelector(".page-header-headings h1, .page-header-headings h2") || p.querySelector("h1, h2")); name = h ? txt(h.textContent, 120) : ""; } catch (e) { return { needLogin: true }; }

  // courses
  let list = [];
  try {
    for (const classification of ["inprogress", "all"]) {
      const d = await call("core_course_get_enrolled_courses_by_timeline_classification", { offset: 0, limit: 0, classification, sort: "fullname" });
      list = (d && d.courses) || []; if (list.length) break;
    }
  } catch (e) { if (e.login) return { needLogin: true }; errors.push("courses " + e.message); }
  const all = list.filter(c => c && c.id).map(c => ({ ou: String(c.id), code: txt(c.shortname, 100), name: txt(c.fullname, 200), home: `${root}/course/view.php?id=${c.id}`, hidden: !!c.hidden }));
  const only = Array.isArray(q.only) && q.only.length ? new Set(q.only.map(String)) : null;
  const skip = new Set((q.skip || []).map(String));

  // the calendar, a month at a time, from pastDays back to aheadDays ahead (6 months at most)
  const evs = new Map();
  const from = new Date(now - Math.min(120, q.pastDays || 60) * 864e5), to = new Date(now + Math.min(150, q.aheadDays || 120) * 864e5);
  for (let y = from.getFullYear(), m = from.getMonth() + 1, k = 0; (y < to.getFullYear() || (y === to.getFullYear() && m <= to.getMonth() + 1)) && k < 7; k++) {
    try {
      const d = await call("core_calendar_get_calendar_monthly_view", { year: y, month: m, courseid: 1, categoryid: 0, includenavigation: false, mini: true, day: 1 });
      ((d && d.weeks) || []).forEach(w => (w.days || []).forEach(dd => (dd.events || []).forEach(e => { if (e && e.id != null) evs.set(String(e.id), e); })));
    } catch (e) { if (e.login) return { needLogin: true }; errors.push("calendar " + y + "-" + m + " " + e.message); if (k === 0) break; }
    m++; if (m > 12) { m = 1; y++; }
  }
  const busyC = new Set([...evs.values()].map(e => String((e.course && e.course.id) || e.courseid || "")));
  const pick = all.filter(c => (only ? only.has(c.ou) : !c.hidden || busyC.has(c.ou)) && !skip.has(c.ou)).slice(0, 20);
  const courses = pick.map(c => ({ ou: c.ou, code: c.code, name: c.name, home: c.home }));

  // a table's columns, by their heading
  const cols = t => [...t.querySelectorAll("thead th, tr:first-child th")].map(th => txt(th.textContent, 80).toLowerCase());
  const colIx = (names, rx) => names.findIndex(n => rx.test(n));
  const detail = async c => {
    const id = c.ou, mine = [...evs.values()].filter(e => String((e.course && e.course.id) || e.courseid || "") === id);
    c.items = []; c.grades = []; c.final = null; c.news = []; c.events = []; c.staff = []; c.syl = []; c.sylUrl = ""; c.marks = [];
    // what's been submitted, and marks, from the assignment and quiz lists
    const sub = {}, mark = {};
    const [ai, qi, gr] = await Promise.all([quiet(`/mod/assign/index.php?id=${id}`, "assignments"), quiet(`/mod/quiz/index.php?id=${id}`, "quizzes"),
      q.grades === false ? null : quiet(`/grade/report/user/index.php?id=${id}`, "grades")]);
    if (ai) ai.querySelectorAll("table").forEach(t => { const h = cols(t), si = colIx(h, /submission/), gi = colIx(h, /^grade/);
      t.querySelectorAll("tbody tr").forEach(tr => { const a = tr.querySelector('a[href*="/mod/assign/view.php"]'), cm = a && cmOf(a.href); if (!cm) return; const td = tr.querySelectorAll("td, th");
        const s = si >= 0 && td[si] ? txt(td[si].textContent, 120) : "";
        if (s) sub[cm.cm] = /not submitted|no submission|no attempt|draft/i.test(s) ? false : /submitted|turned in/i.test(s) ? true : null;
        const g = gi >= 0 && td[gi] ? nums(td[gi].textContent) : []; if (g.length >= 2 && g[1] > 0) mark[cm.cm] = { num: g[0], den: g[1] }; }); });
    if (qi) qi.querySelectorAll("table").forEach(t => { const h = cols(t), gi = colIx(h, /^grade/), out = num((h[gi] || "").split("/")[1]);
      t.querySelectorAll("tbody tr").forEach(tr => { const a = tr.querySelector('a[href*="/mod/quiz/view.php"]'), cm = a && cmOf(a.href); if (!cm) return; const td = tr.querySelectorAll("td, th");
        const g = gi >= 0 && td[gi] ? nums(td[gi].textContent) : [];
        if (g.length) { sub[cm.cm] = true; const den = g.length >= 2 ? g[1] : out; if (den > 0) mark[cm.cm] = { num: g[0], den }; } }); });
    // the grade report: every graded item, its weight, and the course total
    if (gr) gr.querySelectorAll("table.user-grade tr, table.generaltable tr").forEach(tr => {
      const th = tr.querySelector(".column-itemname"), gd = tr.querySelector(".column-grade"); if (!th || !gd) return;
      const nm = txt(th.textContent, 300), a = th.querySelector("a[href]"), cm = a && cmOf(a.href);
      const got = nums(gd.textContent), range = nums((tr.querySelector(".column-range") || {}).textContent), w = num((tr.querySelector(".column-weight") || {}).textContent);
      const pct = num((tr.querySelector(".column-percentage") || {}).textContent), den = range.length >= 2 ? range[1] : null;
      if (/course total/i.test(nm) || tr.classList.contains("coursetotal")) { if (got.length || pct != null) c.final = { shown: txt(gd.textContent, 20), pct: pct != null ? pct : got.length && den ? Math.round(got[0] / den * 1000) / 10 : null }; return; }
      if (!nm || !den) return;
      c.grades.push({ gid: cm ? cm.cm : "g" + nm.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30), name: nm, num: got.length ? got[0] : null, den, weight: w != null && w > 0 ? w : null, shown: got.length ? txt(gd.textContent, 20) : "", at: null });
      if (cm && got.length && !mark[cm.cm]) mark[cm.cm] = { num: got[0], den };
    });
    // the work, from the calendar: assignment due dates, quiz open and close times, and other activities' deadlines
    const work = {};
    mine.forEach(e => {
      const cm = cmOf(e.url || e.viewurl), mod = String(e.modulename || (cm && cm.mod) || ""), type = String(e.eventtype || "");
      if (!mod || !cm) {
        if (/^(course|user|site|group|category)$/.test(type)) c.events.push({ id: String(e.id), title: txt(e.name, 300), text: txt(e.description, 1500), start: iso(e.timestart), end: e.timeduration ? iso(Number(e.timestart) + Number(e.timeduration)) : null, allDay: false, where: txt(e.location, 200), assoc: false, url: `${root}/calendar/view.php?view=day&time=${e.timestart}` });
        return;
      }
      if (/expectcompletionon|gradingdue/.test(type)) return;
      const w = work[cm.cm] || (work[cm.cm] = { mod, cm: cm.cm, name: txt(String(e.activityname || e.name || "").replace(/\s+(is due|opens|closes|due|should be completed)\s*$/i, ""), 300), url: e.url, text: txt(e.description, 1500) });
      const at = iso(e.timesort || e.timestart);
      if (/^open/.test(type)) w.open = at; else if (/^close/.test(type)) w.close = at; else w.due = w.due || at;
    });
    Object.values(work).forEach(w => {
      const quiz = w.mod === "quiz", due = quiz ? w.close || w.due : w.due || w.close, m = mark[w.cm];
      const done = sub[w.cm] === true || !!m ? true : sub[w.cm] === false ? false : null;
      c.items.push({ kind: quiz ? "quiz" : "assignment", id: w.cm, name: w.name, due, start: w.open || null, end: w.close || null, text: w.text, url: w.url || `${root}/mod/${w.mod}/view.php?id=${w.cm}`, gid: w.cm, outOf: m ? m.den : null, done, files: [],
        st: done == null ? null : { subAt: null, late: false, missing: done === false && !!due && Date.parse(due) < now, excused: false, ext: false } });
      if (m && !c.grades.some(g => g.gid === w.cm) && q.grades !== false) c.marks.push({ kind: quiz ? "quiz" : "assignment", id: w.cm, num: m.num, den: m.den, from: quiz ? "quizPage" : "assignmentsPage", how: "" });
    });
    // announcements: the newest discussions in the course's announcements forum
    if (q.news !== false) try {
      const fi = await quiet(`/mod/forum/index.php?id=${id}`, "forums");
      const fa = fi && fi.querySelector('a[href*="/mod/forum/view.php?f="]');
      const fv = fa && await quiet(`/mod/forum/view.php?f=${(/f=(\d+)/.exec(fa.href) || [])[1]}`, "announcements");
      const ds = fv ? [...new Map([...fv.querySelectorAll('a[href*="/mod/forum/discuss.php?d="]')].map(x => [(/d=(\d+)/.exec(x.href) || [])[1], x])).entries()].filter(([d]) => d).slice(0, 4) : [];
      for (const [d, a] of ds) {
        const p = await quiet(`/mod/forum/discuss.php?d=${d}`, "announcement");
        const t = p && p.querySelector("time[datetime]"), body = p && p.querySelector(".post-content-container, .posting, .content");
        c.news.push({ id: d, title: txt(a.textContent, 200), text: body ? txt(body.innerHTML, 3000) : "", date: t ? t.getAttribute("datetime") : null, url: `${root}/mod/forum/discuss.php?d=${d}` });
      }
    } catch (e) { if (e.login) throw e; }
  };
  try { for (let i = 0; i < courses.length; i += 4) await Promise.all(courses.slice(i, i + 4).map(detail)); }
  catch (e) { if (e.login) return { needLogin: true }; throw e; }
  return { ok: true, origin: root, me: { name, id: uid }, all: all.map(c => ({ ou: c.ou, code: c.code, name: c.name })), courses, errors: errors.slice(0, 30), ms: Date.now() - T0 };
}

const CV_FILE = id => `(async () => {
  const r = await fetch('/api/v1/files/${id}', {credentials: 'include', headers: {Accept: 'application/json'}});
  if (r.status === 401 || r.status === 403) return {needLogin: true};
  if (!r.ok) return {error: 'HTTP ' + r.status};
  const f = JSON.parse((await r.text()).replace(/^while\\(1\\);/, ''));
  if (Number(f.size) > 52428800) return {error: 'too-large'};
  return {url: f.url, name: f.display_name || f.filename || '', type: f['content-type'] || ''};
})()`;
const BS_FILE = (ou, folderId, fileId) => `(async () => {
  const v = await (await fetch('/d2l/api/versions/', {credentials: 'include'})).json();
  const le = ((v || []).find(x => String(x.ProductCode).toLowerCase() === 'le') || {}).LatestVersion || '1.50';
  const r = await fetch('/d2l/api/le/' + le + '/${ou}/dropbox/folders/${folderId}/attachments/${fileId}', {credentials: 'include'});
  if (r.status === 401 || r.status === 403) return {needLogin: true};
  if (!r.ok) return {error: 'HTTP ' + r.status};
  const len = Number(r.headers.get('content-length') || 0);
  if (len > 52428800) return {error: 'too-large'};
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length > 52428800) return {error: 'too-large'};
  let cd = r.headers.get('content-disposition') || '', name = '';
  const m = cd.match(/filename\\*=UTF-8''([^;]+)/i) || cd.match(/filename="?([^";]+)"?/i); if (m) { try { name = decodeURIComponent(m[1]); } catch (e) { name = m[1]; } }
  let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768));
  return {ok: true, name, type: r.headers.get('content-type') || '', b64: btoa(s)};
})()`;
const P = {
  brightspace: { part: "persist:brightspace", home: "/d2l/home", ctx: "/d2l/api/versions/", harvest: bsHarvest, feed: /\/d2l\/le\/calendar\/feed\//i },
  canvas: { part: "persist:canvas", home: "/", ctx: "/robots.txt", harvest: cvHarvest, feed: /^\/feeds\/calendars\/[^/]+\.ics$/i },
  blackboard: { part: "persist:blackboard", home: "/ultra/stream", ctx: "/robots.txt", harvest: bbHarvest, feed: /(\/calendarfeed\/|\.ics$)/i },
  moodle: { part: "persist:moodle", home: "/my/", ctx: "/my/", harvest: mdHarvest, feed: /\/calendar\/export_execute\.php$/i }
};
// School sites read only through their calendar link (no sign-in)
const FEED_ONLY = { schoology: /(\/calendar\/feed\/ical\/|\.ics$)/i };
const prov = id => (Object.prototype.hasOwnProperty.call(P, id) ? P[id] : null);
// The exact script run in the school's page for a sync
const harvestScript = (Pv, safe) => `(() => {\n${HARVEST_PRELUDE}\nreturn (${Pv.harvest.toString()})(${JSON.stringify(safe)});\n})()`;

// Which places besides the Grades page a read may take marks from (see MARK_SOURCES in src/js/95-lms.js); off only when switched off
const MARK_KEYS = ["quizPage", "assignmentFeedback", "assignmentsPage", "discussionPage", "attemptScore"];
function markSwitches(m) { const out = {}; MARK_KEYS.forEach(k => { out[k] = !(m && typeof m === "object" && m[k] === false); }); return out; }

// What comes back from the school's page
const KEY_OK = /^[A-Za-z][A-Za-z0-9]{0,23}$/;
const URL_KEYS = new Set(["url", "home"]);
function plain(v, origin, depth, key) {
  if (v === null || typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    if (URL_KEYS.has(key)) { if (!v) return ""; try { return httpsOnly(new URL(v, origin).href) ? v.slice(0, 2000) : ""; } catch (e) { return ""; } }
    return v.slice(0, 8000);
  }
  if (depth > 9 || typeof v !== "object") return undefined;
  if (Array.isArray(v)) return v.slice(0, 1000).map(x => plain(x, origin, depth + 1, "")).filter(x => x !== undefined);
  const out = {};
  for (const k of Object.keys(v).slice(0, 60)) { if (!KEY_OK.test(k)) continue; const x = plain(v[k], origin, depth + 1, k); if (x !== undefined) out[k] = x; }
  return out;
}
const failOf = r => !r || typeof r !== "object" || Array.isArray(r) ? { error: "bad-result" } : r.needLogin === true ? { needLogin: true } : typeof r.error === "string" ? { error: r.error.slice(0, 200) } : null;
const listCap = (a, n, origin) => Array.isArray(a) ? plain(a.slice(0, n), origin, 1, "") : [];
function cleanHarvest(r, origin) {
  const f = failOf(r); if (f) return f;
  if (r.ok !== true) return { error: "bad-result" };
  const me = r.me && typeof r.me === "object" ? r.me : {};
  const out = { ok: true, origin, me: { name: String(me.name || "").slice(0, 200), id: String(me.id || "").slice(0, 80) },
    all: listCap(r.all, 400, origin), courses: listCap(r.courses, 40, origin), errors: (Array.isArray(r.errors) ? r.errors : []).slice(0, 30).map(x => String(x).slice(0, 300)), ms: Number(r.ms) || 0 };
  if (r.items !== undefined) out.items = listCap(r.items, 800, origin);
  if (r.completions !== undefined) out.completions = listCap(r.completions, 800, origin);
  if (r.mail !== undefined) out.mail = listCap(r.mail, 30, origin);
  for (const k of ["lp", "le"]) if (typeof r[k] === "string" && /^\d{1,3}\.\d{1,3}$/.test(r[k])) out[k] = r[k];
  return out;
}
// A file as base64
const MAX_FILE = 52428800;
const B64 = /^[A-Za-z0-9+/]*={0,2}$/;
function cleanFile(r) {
  const f = failOf(r); if (f) return f;
  if (r.ok !== true || typeof r.b64 !== "string" || r.b64.length % 4 || r.b64.length > Math.ceil(MAX_FILE / 3) * 4 || !B64.test(r.b64)) return { error: "bad-file" };
  const type = typeof r.type === "string" && /^[\w.+-]{1,60}\/[\w.+-]{1,100}(\s*;[^\r\n]{0,100})?$/.test(r.type) ? r.type : "";
  return { ok: true, name: String(r.name || "").replace(/[\u0000-\u001F\u007F/\\]/g, "_").slice(0, 255), type, b64: r.b64 };
}

// Sign in
function connect(id, host, parent) {
  const Pv = prov(id), origin = originOf(host);
  if (!Pv) return Promise.resolve({ ok: false, error: "bad-provider" });
  if (!origin) return Promise.resolve({ ok: false, error: "bad-host" });
  return new Promise(resolve => {
    lockPartition(Pv.part);
    const w = new BrowserWindow({ width: 1000, height: 780, parent: parent || undefined, title: "Studyboard \u2013 sign in: " + new URL(origin).host, autoHideMenuBar: true, show: true, webPreferences: prefs(Pv) });
    w.webContents.setUserAgent(chromeUA());
    guardWindow(w, Pv, null);
    showHost(w);
    let done = false, timer = null;
    const finish = r => { if (done) return; done = true; clearInterval(timer); if (!w.isDestroyed()) w.close(); resolve(r); };
    const check = async () => {
      if (done || w.isDestroyed()) return;
      let here = "";
      try { here = new URL(w.webContents.getURL()).origin; } catch (e) { return; }
      if (here !== origin) return;
      const me = await w.webContents.executeJavaScript(WHO[id], true).catch(() => null);
      if (me) finish({ ok: true, origin, name: me.name || "" });
    };
    timer = setInterval(check, 2500);
    w.webContents.on("did-finish-load", check);
    w.on("closed", () => finish({ ok: false, cancelled: true }));
    w.loadURL(origin + Pv.home).catch(() => {});
  });
}

// A hidden page on the platform's own site to run things in, so your sign-in applies
async function withPage(Pv, origin, fn) {
  lockPartition(Pv.part);
  const w = new BrowserWindow({ show: false, width: 800, height: 600, webPreferences: prefs(Pv) });
  w.webContents.setUserAgent(chromeUA());
  guardWindow(w, Pv, origin);
  try {
    try { await w.loadURL(origin + Pv.ctx); } catch (e) { }
    let here = "";
    try { here = new URL(w.webContents.getURL()).origin; } catch (e) {}
    if (here !== origin) return { needLogin: true };
    return await fn(w);
  } finally { if (!w.isDestroyed()) w.destroy(); }
}

async function sync(id, host, opts) {
  const Pv = prov(id), origin = originOf(host);
  if (!Pv) return { error: "bad-provider" };
  if (!origin) return { error: "bad-host" };
  if (busy[id]) return busy[id];
  const o = opts && typeof opts === "object" ? opts : {};
  const idOk = x => /^[\w.-]{1,40}$/.test(x);
  const safe = { pastDays: Math.min(365, Math.max(1, Number(o.pastDays) || 60)), aheadDays: Math.min(400, Math.max(7, Number(o.aheadDays) || 240)),
    grades: o.grades !== false, news: o.news !== false, internal: o.internal !== false, marks: markSwitches(o.marks), budget: 170000,
    only: Array.isArray(o.only) ? o.only.map(String).filter(idOk).slice(0, 40) : null,
    skip: Array.isArray(o.skip) ? o.skip.map(String).filter(idOk).slice(0, 200) : [] };
  busy[id] = (async () => {
    try {
      return cleanHarvest(await withPage(Pv, origin, w => Promise.race([w.webContents.executeJavaScript(harvestScript(Pv, safe), true), timeout(240000)])), origin);
    } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
    finally { busy[id] = null; }
  })();
  return busy[id];
}

// Downloads a file with your sign-in
function downloadVia(Pv, url, name) {
  lockPartition(Pv.part);
  const ses = session.fromPartition(Pv.part);
  const w = new BrowserWindow({ show: false, webPreferences: prefs(Pv) });
  guardWindow(w, Pv, null);
  const tmp = path.join(app.getPath("temp"), "studyboard-dl-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  return new Promise(resolve => {
    let t = null;
    const done = r => { ses.removeListener("will-download", onDl); clearTimeout(t); if (!w.isDestroyed()) w.destroy(); resolve(r); };
    const onDl = (e, item, wc) => {
      if (wc !== w.webContents) return;
      if (item.getTotalBytes() > 52428800) { item.cancel(); return done({ error: "too-large" }); }
      item.setSavePath(tmp);
      item.once("done", async (ev, st) => {
        if (st !== "completed") return done({ error: st });
        try { const buf = await fsp.readFile(tmp); fsp.unlink(tmp).catch(() => {}); if (buf.length > 52428800) return done({ error: "too-large" });
          done({ ok: true, name: name || item.getFilename(), type: item.getMimeType() || "", b64: buf.toString("base64") }); }
        catch (err) { done({ error: String(err && err.message || err) }); }
      });
    };
    ses.on("will-download", onDl);
    t = setTimeout(() => done({ error: "timeout" }), 120000);
    w.webContents.downloadURL(url);
  });
}

// One file attached to an assignment, as bytes (for "Save to Studyboard")
async function file(id, host, spec) {
  const Pv = prov(id), origin = originOf(host), s = spec && typeof spec === "object" ? spec : {};
  const num = x => /^\d{1,14}$/.test(String(x));
  if (!Pv || !origin) return { error: "bad-request" };
  try {
    if (id === "brightspace") {
      if (!num(s.ou) || !num(s.folder) || !num(s.id)) return { error: "bad-request" };
      return cleanFile(await withPage(Pv, origin, w => Promise.race([w.webContents.executeJavaScript(BS_FILE(s.ou, s.folder, s.id), true), timeout(120000)])));
    }
    if (id === "canvas") {
      if (!num(s.id)) return { error: "bad-request" };
      const meta = await withPage(Pv, origin, w => Promise.race([w.webContents.executeJavaScript(CV_FILE(s.id), true), timeout(30000)]));
      const bad = meta && (meta.needLogin || meta.error) ? failOf(meta) : null; if (!meta || bad) return bad || { error: "none" };
      if (typeof meta.url !== "string" || meta.url.length > 4000) return { error: "bad-url" };
      let u; try { u = new URL(meta.url, origin); } catch (e) { return { error: "bad-url" }; }
      if (u.origin !== origin) return { error: "bad-url" };
      const r = await downloadVia(Pv, u.href, typeof meta.name === "string" ? meta.name.slice(0, 255) : "");
      if (r.ok && !r.type && typeof meta.type === "string") r.type = meta.type.slice(0, 160);
      return cleanFile(r);
    }
    return { error: "unsupported" };
  } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
}

// Canvas messages (Inbox)
async function cvMail(s) {
  const hdr = { Accept: "application/json" };
  const parse = async r => { const t = await r.text(); try { return JSON.parse(t.replace(/^while\(1\);/, "")); } catch (e) { return null; } };
  const bad = r => (r.status === 401 || r.status === 403) ? { needLogin: true } : { error: "HTTP " + r.status };
  const clean = (x, n) => String(x == null ? "" : x).replace(/\r/g, "").trim().slice(0, n);
  if (s.op === "list") {
    const r = await fetch("/api/v1/conversations?scope=" + (s.scope === "sent" ? "sent" : "inbox") + "&per_page=30", { credentials: "include", headers: hdr });
    if (!r.ok) return bad(r);
    const a = await parse(r);
    return { ok: true, items: (Array.isArray(a) ? a : []).map(c => ({ id: String(c.id), subject: clean(c.subject, 160) || "(No subject)", preview: clean(c.last_message || c.last_authored_message, 200), at: c.last_message_at || c.last_authored_message_at || "",
      count: Number(c.message_count) || 0, unread: c.workflow_state === "unread", course: clean(c.context_name, 80), names: (c.participants || []).slice(0, 4).map(x => clean(x.name, 60)) })) };
  }
  if (s.op === "get") {
    const [r, me] = await Promise.all([fetch("/api/v1/conversations/" + s.id + "?auto_mark_as_read=true", { credentials: "include", headers: hdr }), fetch("/api/v1/users/self", { credentials: "include", headers: hdr })]);
    if (!r.ok) return bad(r);
    const c = await parse(r), u = me.ok ? await parse(me) : null;
    if (!c) return { error: "empty" };
    const who = {}; (c.participants || []).forEach(x => { who[x.id] = x.name; });
    const meId = u && u.id;
    return { ok: true, subject: clean(c.subject, 160) || "(No subject)", course: clean(c.context_name, 80), names: (c.participants || []).map(x => clean(x.name, 60)).filter(Boolean).slice(0, 8),
      messages: (c.messages || []).slice().reverse().map(m => ({ id: String(m.id), from: clean(who[m.author_id], 60) || "Someone", mine: meId != null && m.author_id === meId, at: m.created_at || "", body: clean(m.body, 6000), files: (m.attachments || []).length })) };
  }
  if (s.op === "send") {
    const m = document.cookie.match(/(?:^|;\s*)_csrf_token=([^;]+)/);
    const token = m ? decodeURIComponent(m[1]) : "";
    const r = await fetch("/api/v1/conversations/" + s.id + "/add_message", { method: "POST", credentials: "include", headers: Object.assign({ "Content-Type": "application/x-www-form-urlencoded", "X-CSRF-Token": token }, hdr), body: "body=" + encodeURIComponent(s.body) });
    if (!r.ok) return bad(r);
    return { ok: true };
  }
  return { error: "bad-request" };
}
// Sending is the only write to a school site, so the person confirms it here
async function confirmSend(parent, origin, convo, body) {
  const c = convo && typeof convo === "object" ? convo : {};
  const names = (Array.isArray(c.names) ? c.names : []).map(n => String(n || "").slice(0, 60)).filter(Boolean).slice(0, 8).join(", ");
  const snippet = body.length > 400 ? body.slice(0, 400) + "\u2026" : body;
  let host = origin; try { host = new URL(origin).host; } catch (e) {}
  const opts = { type: "question", buttons: ["Send", "Cancel"], defaultId: 1, cancelId: 1, noLink: true, title: "Send Reply",
    message: "Send this reply through Canvas?",
    detail: `Conversation: ${String(c.subject || "(No subject)").slice(0, 160)}${c.course ? " (" + String(c.course).slice(0, 80) + ")" : ""}\nTo: ${names || "the people in this conversation"}\nSchool site: ${host}\n\n${snippet}` };
  try { const r = parent && !parent.isDestroyed() ? await dialog.showMessageBox(parent, opts) : await dialog.showMessageBox(opts); return r.response === 0; } catch (e) { return false; }
}
async function mail(id, host, spec, parent) {
  const Pv = prov(id), origin = originOf(host), q = spec && typeof spec === "object" ? spec : {};
  if (!Pv || !origin) return { error: "bad-request" };
  if (id !== "canvas") return { error: "unsupported" };
  const op = ["list", "get", "send"].includes(q.op) ? q.op : null;
  if (!op) return { error: "bad-request" };
  const safe = { op, scope: q.scope === "sent" ? "sent" : "inbox", id: String(q.id || ""), body: typeof q.body === "string" ? q.body.trim().slice(0, 10000) : "" };
  if (op !== "list" && !/^\d{1,14}$/.test(safe.id)) return { error: "bad-request" };
  if (op === "send" && !safe.body) return { error: "empty" };
  const run = (w, o) => Promise.race([w.webContents.executeJavaScript(`(${cvMail.toString()})(${JSON.stringify(o)})`, true), timeout(45000)]);
  try {
    const r = await withPage(Pv, origin, async w => {
      if (op !== "send") return run(w, safe);
      const convo = await run(w, { op: "get", scope: "inbox", id: safe.id, body: "" });
      const bad = failOf(convo); if (bad) return bad;
      if (!(await confirmSend(parent, origin, plain(convo, origin, 0, ""), safe.body))) return { error: "cancelled" };
      return run(w, safe);
    });
    return failOf(r) || plain(r, origin, 0, "");
  }
  catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
}

// The calendar subscription link (it has its own private key in it, so no sign-in is needed)
function feedOk(id, url) {
  const Pv = prov(id) || (Object.prototype.hasOwnProperty.call(FEED_ONLY, id) ? { feed: FEED_ONLY[id] } : null); if (!Pv) return null;
  try {
    const u = new URL(String(url || "").trim().replace(/^webcals?:\/\//i, "https://"));
    const okProto = u.protocol === "https:" || (TEST_MODE && u.origin.startsWith("http://127.0.0.1:"));
    return okProto && Pv.feed.test(u.pathname) && !!originOf(u.origin) ? u.href : null;
  } catch (e) { return null; }
}
// Redirects are followed by hand (at most 3), and every address on the way is checked again
const FEED_MAX = 8e6;
async function publicHost(u) {
  if (TEST_MODE && u.hostname === "127.0.0.1") return true;
  if (!originOf(u.origin)) return false;
  try { const list = await dns.promises.lookup(u.hostname, { all: true, verbatim: true }); return list.length > 0 && list.every(a => !privateIp(a.address)); } catch (e) { return false; }
}
function feedHop(href) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const end = v => { if (settled) return; settled = true; resolve(v); };
    const req = net.request({ url: href, method: "GET", redirect: "manual", credentials: "omit", useSessionCookies: false });
    req.setHeader("Accept", "text/calendar, */*");
    req.on("redirect", (status, method, to) => { end({ status, redirect: String(to || "") }); try { req.abort(); } catch (e) {} });
    req.on("response", res => {
      const head = k => [].concat(res.headers[k] || [])[0] || "";
      if (Number(head("content-length") || 0) > FEED_MAX) { end({ status: res.statusCode, tooLarge: true }); try { req.abort(); } catch (e) {} return; }
      const chunks = []; let n = 0;
      res.on("data", c => { n += c.length; if (n > FEED_MAX) { end({ status: res.statusCode, tooLarge: true }); try { req.abort(); } catch (e) {} } else chunks.push(c); });
      res.on("end", () => end({ status: res.statusCode, text: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", e => { if (!settled) { settled = true; reject(e); } });
    });
    req.on("error", e => { if (!settled) { settled = true; reject(e); } });
    req.end();
  });
}
async function feed(id, url) {
  let href = feedOk(id, url);
  if (!href) return { error: "bad-url" };
  try {
    const run = async () => {
      for (let hop = 0; hop <= 3; hop++) {
        const u = new URL(href);
        if (!httpsOnly(u.href) || !(await publicHost(u))) return { error: "bad-url" };
        const r = await feedHop(u.href);
        if (r.redirect !== undefined) {
          let next; try { next = new URL(r.redirect, u.href); } catch (e) { return { error: "bad-url" }; }
          if (!httpsOnly(next.href)) return { error: "bad-url" };
          href = next.href; continue;
        }
        if (r.tooLarge) return { error: "too-large" };
        if (r.status < 200 || r.status > 299) return { error: "HTTP " + r.status, status: r.status };
        if (!/BEGIN:VCALENDAR/i.test(r.text)) return { error: "not-calendar" };
        return { ok: true, text: r.text };
      }
      return { error: "too-many-redirects" };
    };
    return await Promise.race([run(), timeout(30000)]);
  } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
}

// Is this sign-in still good
const lastPing = {};
async function ping(id, host) {
  const Pv = prov(id), origin = originOf(host);
  if (!Pv || !origin || !WHO[id]) return { error: "bad-provider" };
  if (busy[id]) return { ok: true, busy: true };
  const k = id + "|" + origin, now = Date.now();
  if (lastPing[k] && now - lastPing[k].at < 5 * 60000) return lastPing[k].r;
  let r;
  try {
    r = await Promise.race([withPage(Pv, origin, async w => (await w.webContents.executeJavaScript(WHO[id], true).catch(() => null)) ? { ok: true } : { needLogin: true }), timeout(45000)]);
  } catch (e) { r = { error: String(e && e.message || e).slice(0, 200) }; }
  r = r && r.needLogin ? { needLogin: true } : r && r.ok ? { ok: true } : { error: (r && r.error) || "no-answer" };
  lastPing[k] = { at: now, r };
  return r;
}

async function signOut(id) {
  const Pv = prov(id); if (!Pv) return false;
  Object.keys(lastPing).forEach(k => { if (k.startsWith(id + "|")) delete lastPing[k]; });
  try { await session.fromPartition(Pv.part).clearStorageData(); await session.fromPartition(Pv.part).clearCache(); return true; } catch (e) { return false; }
}

function register(getMain, trusted) {
  const fromMain = e => { const w = getMain(); return !!(w && !w.isDestroyed() && e.sender === w.webContents) && (typeof trusted !== "function" || trusted(e)); };
  ipcMain.handle("lms:connect", (e, id, host) => fromMain(e) ? connect(String(id), host, getMain()) : null);
  ipcMain.handle("lms:sync", (e, id, host, opts) => fromMain(e) ? sync(String(id), host, opts) : null);
  ipcMain.handle("lms:file", (e, id, host, spec) => fromMain(e) ? file(String(id), host, spec) : null);
  ipcMain.handle("lms:mail", (e, id, host, spec) => fromMain(e) ? mail(String(id), host, spec, getMain()) : null);
  ipcMain.handle("lms:feed", (e, id, url) => fromMain(e) ? feed(String(id), url) : null);
  ipcMain.handle("lms:signout", (e, id) => fromMain(e) ? signOut(String(id)) : null);
  ipcMain.handle("lms:ping", (e, id, host) => fromMain(e) ? ping(String(id), host) : null);
  app.on("before-quit", () => { Object.values(P).forEach(Pv => { try { session.fromPartition(Pv.part).cookies.flushStore(); } catch (e) {} }); });
}

// harvestScript, cleanHarvest
module.exports = { MARK_KEYS, markSwitches, WHO, BS_FILE, CV_FILE, cvMail, HARVEST_PRELUDE, register, bsHarvest, cvHarvest, bbHarvest, mdHarvest, originOf, feedOk, connect, sync, file, feed, signOut, ping, mail, harvestScript, cleanHarvest, cleanFile, privateIp, P };
