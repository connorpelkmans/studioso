// The Studyboard School Sync extension's background, as built for the stores (scripts/build-extension.js), run in an empty vm context
// with a stand-in for the browser's extension APIs and a fake Canvas, Brightspace and Blackboard. Checks: the site is found out by itself,
// the background read works and is cleaned and stored, every request stays on the school's own site and is a GET, a "next page" link
// to another site is refused, the toolbar badge shows when sign-in is needed, a web page can only ask for "sync now", removing a school
// drops its data and its permission, and the build itself has no eval and a Firefox manifest the stores accept.
// Run: node tests/extension.test.js
const assert = require("assert"), vm = require("vm");
const {files, manifests} = require("../scripts/build-extension.js");

const ORIGIN = "https://school.example.edu";
function browser(routes) {
  const store = {}, listeners = {}, asked = [], granted = new Set([ORIGIN + "/*"]), badge = {text: ""};
  const ev = name => ({addListener: f => { (listeners[name] = listeners[name] || []).push(f); }});
  const chrome = {
    runtime: {id: "ext", getURL: p => "chrome-extension://ext/" + p, getManifest: () => ({version: "1.0.0"}), getPlatformInfo: async () => ({}), onMessage: ev("msg"), onInstalled: ev("installed"), onStartup: ev("startup")},
    storage: {local: {
      get: async k => { const keys = k == null ? Object.keys(store) : [].concat(k); const o = {}; keys.forEach(x => { if (x in store) o[x] = JSON.parse(JSON.stringify(store[x])); }); return o; },
      set: async o => { Object.assign(store, JSON.parse(JSON.stringify(o))); },
      remove: async k => { [].concat(k).forEach(x => delete store[x]); }
    }},
    permissions: {contains: async p => p.origins.every(o => granted.has(o)), remove: async p => { p.origins.forEach(o => granted.delete(o)); return true; }, onAdded: ev("padd"), onRemoved: ev("prem")},
    alarms: {clear: async () => true, create: async () => {}, onAlarm: ev("alarm")},
    action: {setBadgeText: async o => { badge.text = o.text; }, setBadgeBackgroundColor: async () => {}},
    tabs: {query: async () => [], onUpdated: ev("tabs")},
    scripting: {executeScript: async () => { throw new Error("no tabs here"); }}
  };
  const fetch = async (url, opts) => {
    const u = new URL(url); asked.push([(opts && opts.method) || "GET", u.origin, u.pathname + u.search]);
    const hit = routes.find(([re]) => re.test(u.pathname + u.search));
    const body = hit ? (typeof hit[1] === "function" ? hit[1](u) : hit[1]) : null, status = hit ? (hit[2] || 200) : 404;
    const headers = {get: k => /content-type/i.test(k) ? "application/json" : /link/i.test(k) && hit && hit[3] ? hit[3] : ""};
    return {ok: status < 300, status, headers, json: async () => body, text: async () => JSON.stringify(body)};
  };
  const ctx = vm.createContext({chrome, fetch, URL, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, encodeURIComponent, console});
  vm.runInContext(files("chrome")["background.js"], ctx, {filename: "background.js"});
  const send = (m, sender) => new Promise(res => listeners.msg[0](m, sender || {id: "ext", url: "chrome-extension://ext/popup.html"}, res));
  return {send, store, asked, granted, badge};
}
const DAY = 864e5, iso = d => new Date(Date.now() + d * DAY).toISOString();
const CANVAS = [
  [/^\/api\/v1\/users\/self$/, {id: 9, name: "Ana Lee"}],
  [/^\/api\/v1\/courses\?enrollment_state=active/, [{id: 201, name: "History 200", course_code: "HIS200"}]],
  // the assignments' "next page" points at another site: it must never be followed
  [/^\/api\/v1\/courses\/201\/assignments\?/, [{id: 1, name: "Essay 1", due_at: iso(-3), published: true, points_possible: 20, submission_types: ["online_upload"], submission: {submitted_at: iso(-4), workflow_state: "submitted"}}], 200, '<https://evil.example.com/steal>; rel="next"'],
];

let n = 0; const ok = (c, m) => { n++; assert(c, m); };
(async () => {
  // Build: the stores' rules
  const h = files("chrome")["harvest.js"], m = manifests();
  ok(!/\beval\s*\(|new Function\s*\(/.test(h + files("chrome")["background.js"]), "nothing is evaluated from text");
  ok(m.firefox.background.scripts[0] === "background.js" && !m.firefox.background.service_worker && m.firefox.browser_specific_settings.gecko.id && m.firefox.browser_specific_settings.gecko.data_collection_permissions.required.length, "the Firefox manifest has a background script, an add-on id and its data collection declared");
  ok(m.chrome.background.service_worker === "background.js" && !m.chrome.host_permissions, "the Chrome manifest has a service worker and no install-time site access");
  ok(m.chrome.description.length <= 132, "the description fits the Chrome Web Store's 132 characters");

  // Connect with the platform found out by itself, then the background read
  const b = browser(CANVAS);
  const r = await b.send({op: "add", origin: "school.example.edu", platform: ""});
  ok(r.ok && r.id === "canvas", "the platform is found out by itself: " + JSON.stringify(r));
  for (let i = 0; i < 100 && !(b.store.status && b.store.status.canvas && b.store.status.canvas.state === "ok"); i++) await new Promise(res => setTimeout(res, 20));
  const res = b.store["result:canvas"];
  ok(res && res.h.ok && res.h.courses[0].items[0].done === true, "the background read is cleaned and stored, with the submission");
  ok(b.asked.every(([meth, o]) => meth === "GET" && o === ORIGIN), "every request is a GET to the school's own site");
  ok(!b.asked.some(([, o]) => /evil/.test(o)), "a next-page link to another site is not followed");
  ok(b.badge.text === "", "no badge when it's fine");

  // A page (relay.js) may only ask for "sync now"
  const fromPage = {id: "ext", url: "https://studyboardapp.com/", tab: {id: 1}};
  ok((await b.send({op: "remove", id: "canvas"}, fromPage)).error === "not-allowed", "a web page can't remove a school");
  ok((await b.send({op: "add", origin: "https://other.edu"}, fromPage)).error === "not-allowed", "a web page can't connect a site");
  ok((await b.send({op: "sync"}, fromPage)).ok, "a web page can ask for a sync now");

  // Signed out: the badge says so
  const s = browser([[/^\/api\/v1\/users\/self$/, {errors: [{message: "unauthorized"}]}, 401]]);
  await s.send({op: "add", origin: ORIGIN, platform: "canvas"});
  for (let i = 0; i < 100 && !(s.store.status && s.store.status.canvas && s.store.status.canvas.state === "login"); i++) await new Promise(res => setTimeout(res, 20));
  ok(s.store.status.canvas.state === "login" && s.badge.text === "!", "signed out: the status asks to sign in and the toolbar badge shows");

  // Remove: its data and its permission go
  await b.send({op: "remove", id: "canvas"});
  ok(!b.store["result:canvas"] && !b.granted.has(ORIGIN + "/*") && !Object.keys(b.store.schools).length, "removing a school drops its data and the permission");

  // An address that isn't a public https site is refused
  ok((await b.send({op: "add", origin: "http://192.168.1.1", platform: "canvas"})).error === "bad-address", "a local or plain-http address is refused");
  console.log("extension: " + n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
