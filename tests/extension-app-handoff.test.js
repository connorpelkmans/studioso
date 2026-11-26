// The Safari extension built into the iPhone app: handing a school site's sign-in to the app (schools that sign in with Google)
const assert = require("assert"), vm = require("vm");
const {files, manifests} = require("../scripts/build-extension.js");

const ORIGIN = "https://school.instructure.com", OTHER = "https://other.example.edu";
function browser(target, opts) {
  const o = Object.assign({wanted: [], signedIn: true, granted: [ORIGIN], tabs: []}, opts || {});
  const store = {}, listeners = {}, native = [], ran = [], cookieAsks = [], granted = new Set(o.granted.map(x => x + "/*"));
  const ev = name => ({addListener: f => { (listeners[name] = listeners[name] || []).push(f); }});
  const COOKIES = [
    {name: "canvas_session", value: "s3cret", domain: "school.instructure.com", path: "/", secure: true, httpOnly: true, hostOnly: true, sameSite: "lax", session: true},
    {name: "_csrf_token", value: "t", domain: "school.instructure.com", path: "/", secure: true, httpOnly: false, hostOnly: true, sameSite: "lax", expirationDate: 1900000000},
    {name: "lb", value: "x", domain: ".instructure.com", path: "/", secure: true, httpOnly: false, hostOnly: false, sameSite: "no_restriction"},
    {name: "tracker", value: "no", domain: ".evil.example.com", path: "/", secure: true, httpOnly: false, hostOnly: false}
  ];
  const chrome = {
    runtime: {id: "ext", getURL: p => "safari-web-extension://ext/" + p, getManifest: () => manifests()[target], getPlatformInfo: async () => ({}),
      onMessage: ev("msg"), onInstalled: ev("installed"), onStartup: ev("startup"),
      sendNativeMessage: async (app, m) => {
        native.push([app, JSON.parse(JSON.stringify(m))]);
        if (m.op === "wanted") return {v: 1, wanted: o.wanted};
        if (m.op === "handoff" || m.op === "result") return {ok: true};
        return {error: "bad-request"};
      }},
    storage: {local: {
      get: async k => { const keys = k == null ? Object.keys(store) : [].concat(k); const r = {}; keys.forEach(x => { if (x in store) r[x] = JSON.parse(JSON.stringify(store[x])); }); return r; },
      set: async v => { Object.assign(store, JSON.parse(JSON.stringify(v))); },
      remove: async k => { [].concat(k).forEach(x => delete store[x]); }
    }, onChanged: ev("storage")},
    permissions: {contains: async p => p.origins.every(x => granted.has(x)), getAll: async () => ({origins: [...granted]}), remove: async () => true, onAdded: ev("padd"), onRemoved: ev("prem")},
    alarms: {clear: async () => true, create: async () => {}, onAlarm: ev("alarm")},
    action: {setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {}},
    tabs: {query: async () => o.tabs, onUpdated: ev("tabs")},
    cookies: {getAll: async q => { cookieAsks.push(q); return COOKIES.map(c => Object.assign({}, c)); }},
    scripting: {executeScript: async d => { ran.push(d.func && d.func.name); return [{result: null}]; }}
  };
  const fetch = async url => {
    const u = new URL(url), me = /\/api\/v1\/users\/self$/.test(u.pathname);
    const status = me ? (o.signedIn ? 200 : 401) : 404;
    return {ok: status < 300, status, url: u.href, headers: {get: k => /content-type/i.test(k) ? "application/json" : ""}, json: async () => (me && o.signedIn ? {id: 9, name: "Ana Lee"} : {}), text: async () => ""};
  };
  const ctx = vm.createContext({chrome, fetch, URL, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, encodeURIComponent, console, Set});
  vm.runInContext(files(target)["background.js"], ctx, {filename: "background.js"});
  const loaded = async (url, tabId) => { (listeners.tabs || []).forEach(f => f(tabId || 7, {status: "complete"}, {id: tabId || 7, url})); await new Promise(r => setTimeout(r, 30)); };
  const toAppResult = (id, origin, h) => vm.runInContext("resultToApp", ctx)(id, origin, Date.now(), h);
  return {loaded, native, ran, store, cookieAsks, granted, o, toAppResult};
}

let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const handoffs = b => b.native.filter(([, m]) => m.op === "handoff");
(async () => {
  // waiting app, signed in on the site: the site's own sign-in goes to the app, nothing from other sites
  { const b = browser("safari-inapp", {wanted: [{id: "canvas", origin: ORIGIN, need: true}]});
    await b.loaded(ORIGIN + "/courses");
    const h = handoffs(b);
    ok(h.length === 1 && h[0][0] === "com.studyboardapp.studyboard", "the school's sign-in goes to the Studyboard app once: " + JSON.stringify(b.native.map(x => x[1].op)));
    const m = h[0][1], names = m.cookies.map(c => c.name).sort();
    ok(m.v === 1 && m.id === "canvas" && m.origin === ORIGIN && JSON.stringify(names) === JSON.stringify(["_csrf_token", "canvas_session", "lb"]), "only cookies the school site gets (its own and its parent domain's), none from other sites: " + names);
    const s = m.cookies.find(c => c.name === "canvas_session");
    ok(s.httpOnly === true && s.hostOnly === true && s.secure === true && s.expirationDate === null && !("session" in s), "each cookie is passed as the app's handler reads it");
    const w = b.native.find(([, x]) => x.op === "wanted")[1];
    ok(Array.isArray(w.granted) && w.granted.includes(ORIGIN + "/*"), "the app learns which sites Safari lets the extension read (for its setup steps)");
    ok(b.ran.includes("backToAppNote"), "a note on the page leads back to the app");
    ok(b.store["handAt:" + ORIGIN] > 0, "when it was handed over is kept"); }

  // the app isn't waiting: once in a while only
  { const b = browser("safari-inapp", {wanted: [{id: "canvas", origin: ORIGIN, need: false}]});
    await b.loaded(ORIGIN + "/");
    ok(handoffs(b).length === 1 && !b.ran.includes("backToAppNote"), "a fresh sign-in is passed on without a note when the app isn't waiting");
    await b.loaded(ORIGIN + "/courses/1");
    ok(handoffs(b).length === 1, "and not again within six hours");
    b.store["handAt:" + ORIGIN] = Date.now() - 7 * 3600000;
    await b.loaded(ORIGIN + "/courses/2");
    ok(handoffs(b).length === 2, "after six hours it's refreshed"); }

  // not wanted, not signed in, not allowed: nothing is read or sent
  { const b = browser("safari-inapp", {wanted: [{id: "canvas", origin: OTHER, need: true}]});
    await b.loaded(ORIGIN + "/");
    ok(handoffs(b).length === 0 && b.cookieAsks.length === 0, "a site the app didn't ask for: no cookies read, nothing sent"); }
  { const b = browser("safari-inapp", {wanted: [{id: "canvas", origin: ORIGIN, need: true}], signedIn: false});
    await b.loaded(ORIGIN + "/login");
    ok(handoffs(b).length === 0 && b.cookieAsks.length === 0, "not signed in yet: nothing sent"); }
  { const b = browser("safari-inapp", {wanted: [{id: "canvas", origin: ORIGIN, need: true}], granted: []});
    await b.loaded(ORIGIN + "/");
    ok(handoffs(b).length === 0 && b.cookieAsks.length === 0, "a site Safari hasn't allowed: nothing read or sent"); }
  { const b = browser("safari-inapp", {wanted: [{id: "canvas", origin: "https://school.instructure.com/../x", need: true}, {id: "nope", origin: ORIGIN, need: true}]});
    await b.loaded(ORIGIN + "/");
    ok(handoffs(b).length === 0, "a malformed answer from the app is ignored"); }

  // what the extension reads goes to the app too, for a site the app asked about
  { const b = browser("safari-inapp", {wanted: [{id: "canvas", origin: ORIGIN, need: false}]});
    const ok1 = await b.toAppResult("canvas", ORIGIN, {ok: true, courses: [{id: "201", name: "History 200", items: []}]});
    const sent = b.native.filter(([, m]) => m.op === "result");
    ok(ok1 && sent.length === 1 && sent[0][1].id === "canvas" && sent[0][1].origin === ORIGIN && sent[0][1].h.courses[0].name === "History 200" && sent[0][1].at > 0, "a good read is sent to the app");
    const ok2 = await b.toAppResult("brightspace", "https://d2l.other.edu", {ok: true});
    ok(!ok2 && b.native.filter(([, m]) => m.op === "result").length === 1, "a read of a site the app didn't ask about isn't sent"); }

  // the store builds never talk to an app
  for (const t of ["chrome", "safari"]) {
    const b = browser(t, {wanted: [{id: "canvas", origin: ORIGIN, need: true}]});
    await b.loaded(ORIGIN + "/");
    ok(b.native.length === 0 && b.cookieAsks.length === 0, t + ": no native messages, no cookies read");
  }
  console.log("extension-app-handoff: " + n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
