// The Studyboard School Sync extension's background, as built for the stores
const assert = require("assert"), vm = require("vm");
const {files, manifests} = require("../scripts/build-extension.js");

const ORIGIN = "https://school.example.edu";
function browser(routes) {
  const store = {}, listeners = {}, asked = [], granted = new Set([ORIGIN + "/*"]), badge = {text: ""};
  const ev = name => ({addListener: f => { (listeners[name] = listeners[name] || []).push(f); }});
  const chrome = {
    runtime: {id: "ext", getURL: p => "chrome-extension://ext/" + p, getManifest: () => ({version: "1.0.0"}), getPlatformInfo: async () => ({}), onMessage: ev("msg"), onMessageExternal: ev("ext"), onInstalled: ev("installed"), onStartup: ev("startup")},
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
  const sendExt = (m, origin) => new Promise(res => { const kept = listeners.ext[0](m, {origin, url: origin + "/"}, res); if (!kept) res(undefined); });
  const fire = (name, ...a) => (listeners[name] || []).forEach(f => f(...a));
  return {send, sendExt, fire, store, asked, granted, badge};
}
const DAY = 864e5, iso = d => new Date(Date.now() + d * DAY).toISOString();
const CANVAS = [
  [/^\/api\/v1\/users\/self$/, {id: 9, name: "Ana Lee"}],
  [/^\/api\/v1\/courses\?enrollment_state=active/, [{id: 201, name: "History 200", course_code: "HIS200"}]],
  // the assignments' "next page" points at another site
  [/^\/api\/v1\/courses\/201\/assignments\?/, [{id: 1, name: "Essay 1", due_at: iso(-3), published: true, points_possible: 20, submission_types: ["online_upload"], submission: {submitted_at: iso(-4), workflow_state: "submitted"}}], 200, '<https://evil.example.com/steal>; rel="next"'],
];

let n = 0; const ok = (c, m) => { n++; assert(c, m); };
(async () => {
  const h = files("chrome")["harvest.js"], m = manifests();
  ok(!/\beval\s*\(|new Function\s*\(/.test(h + files("chrome")["background.js"]), "nothing is evaluated from text");
  ok(m.firefox.background.scripts[0] === "background.js" && !m.firefox.background.service_worker && m.firefox.browser_specific_settings.gecko.id && m.firefox.browser_specific_settings.gecko.data_collection_permissions.required.length, "the Firefox manifest has a background script, an add-on id and its data collection declared");
  ok(m.chrome.background.service_worker === "background.js" && !m.chrome.host_permissions, "the Chrome manifest has a service worker and no install-time site access");
  ok(m.safari.background.scripts[0] === "background.js" && m.safari.background.persistent === false && !m.safari.background.service_worker && !m.safari.externally_connectable && !m.safari.minimum_chrome_version && m.safari.browser_specific_settings.safari.strict_min_version, "the Safari manifest has a non-persistent background script (required on iPhone and iPad), no Chrome-only keys and a minimum Safari");
  ok(m.safari.version === m.chrome.version && JSON.stringify(m.safari.permissions) === JSON.stringify(m.chrome.permissions) && JSON.stringify(m.safari.optional_host_permissions) === JSON.stringify(m.chrome.optional_host_permissions), "Safari asks for the same permissions as Chrome");
  ok(files("safari")["background.js"] === files("firefox")["background.js"], "Safari runs the same background as Firefox");
  ok(m.chrome.description.length <= 132, "the description fits the Chrome Web Store's 132 characters");

  const b = browser(CANVAS);
  const r = await b.send({op: "add", origin: "school.example.edu", platform: ""});
  ok(r.ok && r.id === "canvas", "the platform is found out by itself: " + JSON.stringify(r));
  for (let i = 0; i < 100 && !(b.store.status && b.store.status.canvas && b.store.status.canvas.state === "ok"); i++) await new Promise(res => setTimeout(res, 20));
  const res = b.store["result:canvas"];
  ok(res && res.h.ok && res.h.courses[0].items[0].done === true, "the background read is cleaned and stored, with the submission");
  ok(b.asked.every(([meth, o]) => meth === "GET" && o === ORIGIN), "every request is a GET to the school's own site");
  ok(!b.asked.some(([, o]) => /evil/.test(o)), "a next-page link to another site is not followed");
  ok(b.badge.text === "", "no badge when it's fine");

  const got = await b.sendExt({type: "get"}, "https://studyboardapp.com");
  ok(got && got.v === 1 && got.list.length === 1 && got.list[0].id === "canvas" && got.schools[0].id === "canvas", "studyboardapp.com can ask the extension directly for what it read");
  ok((await b.sendExt({type: "get"}, "https://evil.example.com")) === undefined, "no other site can");
  ok((await b.sendExt({type: "sync"}, "https://studyboardapp.com")).ok && (await b.sendExt({type: "remove", id: "canvas"}, "https://studyboardapp.com")) === undefined, "the website can ask for a sync now, and nothing else");
  ok(m.chrome.externally_connectable.matches.every(x => /^https:\/\/(www\.)?studyboardapp\.com\/\*$/.test(x)) && !m.firefox.externally_connectable, "only studyboardapp.com may connect (Chrome and Edge; Firefox uses relay.js)");
  const fromPage = {id: "ext", url: "https://studyboardapp.com/", tab: {id: 1}};
  ok((await b.send({op: "remove", id: "canvas"}, fromPage)).error === "not-allowed", "a web page can't remove a school");
  ok((await b.send({op: "add", origin: "https://other.edu"}, fromPage)).error === "not-allowed", "a web page can't connect a site");
  ok((await b.send({op: "sync"}, fromPage)).ok, "a web page can ask for a sync now");

  ok((await b.send({op: "settings", every: 15})).settings.every === 15, "every 15 minutes can be chosen");
  const n0 = b.asked.length;
  await b.send({op: "sync", why: "open"}, fromPage); await new Promise(r => setTimeout(r, 50));
  ok(b.asked.length === n0, "opening Studyboard right after a read doesn't read the school site again");
  b.store.status.canvas.at = b.store.status.canvas.lastOk = Date.now() - 11 * 60000;
  await b.send({op: "sync", why: "open"}, fromPage);
  for (let i = 0; i < 100 && b.asked.length === n0; i++) await new Promise(r => setTimeout(r, 20));
  for (let i = 0; i < 100 && b.store.status.canvas.state !== "ok"; i++) await new Promise(r => setTimeout(r, 20));
  ok(b.asked.length > n0, "opening Studyboard 10+ minutes after the last read reads it");
  const n1 = b.asked.length;
  await b.send({op: "sync", id: "canvas"}); ok(b.asked.length > n1, "Sync Now in the popup always reads");
  const s = browser([[/^\/api\/v1\/users\/self$/, {errors: [{message: "unauthorized"}]}, 401]]);
  await s.send({op: "add", origin: ORIGIN, platform: "canvas"});
  for (let i = 0; i < 100 && !(s.store.status && s.store.status.canvas && s.store.status.canvas.state === "login"); i++) await new Promise(res => setTimeout(res, 20));
  ok(s.store.status.canvas.state === "login" && s.badge.text === "!", "signed out: the status asks to sign in and the toolbar badge shows");
  const sn = s.asked.length;
  s.store.status.canvas.at = Date.now() - 6 * 60000; s.store.status.canvas.fails = 3;
  await new Promise(res => s.send({op: "sync"}, {id: "ext", url: "chrome-extension://ext/popup.html"}).then(res));
  ok(s.asked.length > sn, "Sync Now still reads while signed out");
  for (let i = 0; i < 100 && s.store.status.canvas.state === "syncing"; i++) await new Promise(r => setTimeout(r, 20));
  const wait = async () => { for (let i = 0; i < 30; i++) await new Promise(r => setTimeout(r, 10)); };
  s.store.status.canvas.at = Date.now() - 20 * 60000; s.store.status.canvas.fails = 3;
  const sn2 = s.asked.length; s.fire("alarm", {name: "sync"}); await wait();
  ok(s.asked.length === sn2, "after three failed reads, the timer doesn't try again 20 minutes later");
  s.store.status.canvas.at = Date.now() - 61 * 60000; s.store.status.canvas.fails = 3;
  s.fire("alarm", {name: "sync"}); for (let i = 0; i < 100 && s.asked.length === sn2; i++) await new Promise(r => setTimeout(r, 10));
  ok(s.asked.length > sn2, "it tries again after about an hour");

  await b.send({op: "remove", id: "canvas"});
  ok(!b.store["result:canvas"] && !b.granted.has(ORIGIN + "/*") && !Object.keys(b.store.schools).length, "removing a school drops its data and the permission");

  ok((await b.send({op: "add", origin: "http://192.168.1.1", platform: "canvas"})).error === "bad-address", "a local or plain-http address is refused");
  console.log("extension: " + n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
