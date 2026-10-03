// Unit tests for the crash/error reporter's pure core (extracted from index.html between ERRREPORT-START and ERRREPORT-END),
// build-id.js and the error-ingest schema check.  Run: node tests/error-report.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const s = fs.readFileSync(path.join(root, "index.html"), "utf8");
const code = s.slice(s.indexOf("/*ERRREPORT-START*/"), s.indexOf("/*ERRREPORT-END*/"));
assert(code.length > 1000, "core not found");
const C = new Function(code + ";return ERRCORE;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const OWN = ["studyboard.example"];

// ---- scrubber: emails, keys, URLs, ids, paths
const t1 = C.scrubText("Failed for jane.doe@school.edu with key AIzaSyA1234567890abcdefghijklmnop and sk-abcdef1234567890abcd", 400);
ok(!/jane|school\.edu|AIza|sk-abc/.test(t1) && /\[email\]/.test(t1) && /\[hidden\]/.test(t1), t1);
ok(!/eyJ/.test(C.scrubText("jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk end")), "jwt");
ok(!/Bearer\s+abcdef/i.test(C.scrubText("Authorization: Bearer abcdef0123456789abcdef")), "bearer");
ok(!/sb_secret_abc/.test(C.scrubText("sb_secret_abcdefghijk")), "supabase secret");
const u = C.scrubText("GET https://studyboard.example/app/index.html?user=jane@x.com&token=abc#frag failed", 300, null, OWN);
ok(u.includes("https://studyboard.example/app/index.html") && !/\?|#|jane|token/.test(u), u);
eq(C.scrubUrl("https://myschool.brightspace.com/d2l/le/123456789/content", OWN), "[external-url]", "school host hidden");
eq(C.scrubUrl("https://abc.supabase.co/rest/v1/tasks?select=*", OWN), "https://abc.supabase.co", "api host kept, no path");
eq(C.scrubUrl("file:///Users/jane/Documents/Studyboard/index.html?x=1"), "file:///index.html", "file url");
eq(C.scrubUrl("chrome-extension://abcdefg/inject.js"), "[extension-url]");
ok(!/jane|Bio notes|y\.txt/.test(C.scrubText("ENOENT: no such file C:\\Users\\jane\\Documents\\Bio notes.docx and /home/jane/x/y.txt")), "paths and file names");
ok(!/[0-9a-f]{8}-[0-9a-f]{4}-/.test(C.scrubText("user 123e4567-e89b-12d3-a456-426614174000 not found")), "uuid");
// PII-like task titles: quoted text and known titles
const q = C.scrubText(`Unexpected token 'S', "Study for Dr. Patel's oncology exam" is not valid JSON`, 300);
ok(!/Patel|oncology/.test(q), q);
ok(/reading 'foo'/.test(C.scrubText("Cannot read properties of undefined (reading 'foo')")), "identifiers survive");
const red = C.redactor(["Physics lab report: Jane's sleep study", "ab", "Dr. Patel"]);
const r = C.scrubText("render failed on Physics lab report: Jane's sleep study (Dr. Patel office hours)", 300, red);
ok(!/Physics|Patel|sleep/.test(r), r);
ok(C.scrubText("x ".repeat(500), 100).length === 100, "cap");

// ---- stacks and fingerprints
const chrome = `TypeError: Cannot read properties of undefined (reading 'x')
    at renderCard (https://studyboard.example/index.html?v=3:30412:9)
    at async Object.render (https://studyboard.example/index.html:10730:5)
    at Array.map (<anonymous>)
    at https://studyboard.example/index.html:5:1`;
const fr = C.parseStack(chrome, OWN);
ok(fr.length === 3 && fr[2]["function"] === "renderCard" && fr[2].lineno === 30412 && fr[2].colno === 9 && fr[2].filename === "index.html" && fr[2].in_app, JSON.stringify(fr));
ok(fr[0].lineno === 5, "oldest first");
const ff = C.parseStack("renderCard@https://studyboard.example/index.html:30412:9\nrender@https://studyboard.example/index.html:10730:5", OWN);
ok(ff.length === 2 && ff[1]["function"] === "renderCard", "firefox/safari format");
ok(C.parseStack("at f (/home/jane/app/main.js:3:4)")[0].filename === "main.js", "node path reduced to the file name");
ok(C.parseStack("at f (C:\\Users\\jane\\app\\main.js:3:4)")[0].filename === "main.js", "windows path reduced");
ok(!JSON.stringify(C.parseStack("at f (https://evil.example/a.js?u=jane@x.com:1:2)", OWN)).includes("jane"), "external frame");
const f1 = C.fingerprint("TypeError", fr, "a 12 b"), f2 = C.fingerprint("TypeError", fr, "other message 99");
ok(f1 === f2 && /^[0-9a-f]{8}$/.test(f1), "stack decides the fingerprint");
ok(C.fingerprint("RangeError", fr, "") !== f1, "class matters");
ok(C.fingerprint("Error", [], 'bad "Math homework" id 42') === C.fingerprint("Error", [], 'bad "Other" id 7'), "no stack: quoted text and digits normalised");

// ---- ignore list
const ign = (m, extra) => C.ignore(Object.assign({message: m, type: "Error"}, extra), {own: OWN, online: true});
ok(ign("ResizeObserver loop completed with undelivered notifications."), "resize observer");
ok(ign("Script error."), "cross-origin");
ok(ign("x", {stack: "at a (chrome-extension://abc/c.js:1:1)"}), "extension");
ok(ign("The user aborted a request."), "aborted");
ok(C.ignore({message: "aborted", type: "AbortError"}, {}), "AbortError");
ok(ign("Load failed"), "safari load failed");
ok(C.ignore({message: "Load failed", type: "TypeError"}, {online: false}) === "offline", "offline reason");
ok(ign("boom", {stack: "at f (https://cdn.other.example/lib.js:1:1)"}), "third-party only frames");
ok(!ign("boom", {stack: "at f (https://studyboard.example/index.html:1:1)"}), "own frames reported");
ok(!ign("Cannot read properties of undefined"), "real errors reported");

// ---- DSN parsing
const d = C.parseDsn("https://abcdef0123456789abcdef0123456789@o4501.ingest.sentry.io/4507001");
ok(d && d.key === "abcdef0123456789abcdef0123456789" && d.project === "4507001" && d.host === "o4501.ingest.sentry.io", JSON.stringify(d));
eq(d.url, "https://o4501.ingest.sentry.io/api/4507001/envelope/?sentry_key=abcdef0123456789abcdef0123456789&sentry_version=7&sentry_client=studyboard-errreport%2F1");
ok(C.parseDsn("https://abcdef0123456789:secretpart@sentry.example.com:9000/relay/12").url.startsWith("https://sentry.example.com:9000/relay/api/12/envelope/"), "self-hosted with path and legacy secret");
ok(!C.parseDsn("https://abcdef0123456789:secretpart@sentry.example.com/12").dsn.includes("secret"), "secret dropped");
["", "nonsense", "http://abcdef0123456789@o1.ingest.sentry.io/1", "https://@o1.ingest.sentry.io/1", "https://abcdef0123456789@o1.ingest.sentry.io/", "https://abcdef0123456789@o1.ingest.sentry.io/abc", "https://abc@o1.ingest.sentry.io/1", "javascript:alert(1)", null, undefined].forEach(x => ok(C.parseDsn(x) === null, "invalid DSN " + x));

// ---- event + envelope (Sentry envelope format)
const ctx = {release: "1.13.0", environment: "production", build: "1.13.0+abc123def456", platform: "pwa", pro: true, theme: "aurora", dark: "dark", sw: "studyboard-v4", anon: "0123456789abcdef", own: OWN,
  redact: ["Physics lab report"], crumbs: [], now: 1_800_000_000_000};
C.addCrumb(ctx.crumbs, "nav", "board", ctx.now); C.addCrumb(ctx.crumbs, "act", "bug-open", ctx.now); C.addCrumb(ctx.crumbs, "sync", "fail", ctx.now);
C.addCrumb(ctx.crumbs, "act", "Typed by user: buy milk", ctx.now); C.addCrumb(ctx.crumbs, "nav", "my secret tab", ctx.now); C.addCrumb(ctx.crumbs, "sheet", "Delete Physics lab report", ctx.now); C.addCrumb(ctx.crumbs, "bogus", "x", ctx.now);
eq(ctx.crumbs.map(c => c.category + ":" + c.message), ["nav:board", "act:bug-open", "sync:fail"], "breadcrumb whitelist");
const ev = C.finish(C.buildEvent({kind: "error", type: "TypeError", message: "bad thing for jane@x.com in Physics lab report", stack: chrome}, ctx));
ok(/^[0-9a-f]{32}$/.test(ev.event_id), "event id");
ok(ev.timestamp === 1_800_000_000 && ev.platform === "javascript" && ev.release === "1.13.0" && ev.environment === "production", "basics");
ok(ev.tags.pro === "yes" && ev.tags.platform === "pwa" && ev.tags.theme === "aurora" && ev.tags.sw === "studyboard-v4" && ev.tags.build === "1.13.0+abc123def456".replace("+", ""), JSON.stringify(ev.tags));
eq(ev.user, {id: "0123456789abcdef"}, "only the anonymous id");
ok(!/jane|Physics/.test(JSON.stringify(ev)), "no personal data in the event");
ok(ev.exception.values[0].stacktrace.frames.length === 3 && ev.fingerprint.length === 1, "frames and fingerprint");
const fitted = C.finish(C.buildEvent({kind: "error", type: "Error", message: "m", stack: "at f (https://studyboard.example/index.html:1:1)\n".repeat(80)}, Object.assign({}, ctx, {crumbs: []})));
ok(fitted.exception.values[0].stacktrace.frames.length <= 30, "frame cap");
const env = C.envelope(ev, d, "2026-10-03T12:00:00.000Z");
const lines = env.split("\n");
ok(lines.length === 4 && lines[3] === "", "three lines, newline terminated");
const h = JSON.parse(lines[0]), ih = JSON.parse(lines[1]);
ok(h.event_id === ev.event_id && h.dsn === d.dsn && h.sent_at === "2026-10-03T12:00:00.000Z", JSON.stringify(h));
ok(ih.type === "event" && ih.length === Buffer.byteLength(lines[2]), JSON.stringify(ih));
eq(JSON.parse(lines[2]), JSON.parse(JSON.stringify(ev)), "payload round trip");
const big = C.finish(C.buildEvent({kind: "error", type: "Error", message: "m".repeat(5000), stack: ""}, ctx));
ok(JSON.stringify(big).length < 24000, "size cap");

// ---- rate limiting, dedupe, back-off, queue, consent
let T = 0; const L = C.makeLimiter({now: () => T, random: () => 0.1, maxSession: 5, perFp: 2});
ok(L.allow("a", "error") && L.allow("a", "error") && !L.allow("a", "error"), "per fingerprint");
T += 3600001; ok(L.allow("a", "error"), "per fingerprint window is an hour");
ok(L.allow("b", "error") && L.allow("c", "error") && !L.allow("d", "error"), "session cap of 5");
const L2 = C.makeLimiter({random: () => 0.9}); ok(!L2.allow("x", "console") && L2.allow("x", "error"), "console errors are sampled");
let T2 = 0; const L3 = C.makeLimiter({now: () => T2});
ok(!L3.blocked() && L3.delay() === 0, "no back-off at first"); L3.fail(); ok(L3.blocked() && L3.delay() === 30000, "first failure 30s"); L3.fail(); ok(L3.delay() === 60000, "doubles");
for (let i = 0; i < 20; i++) L3.fail(); ok(L3.delay() === 3600000, "capped at an hour"); T2 += 3600001; ok(!L3.blocked(), "back-off ends"); L3.ok(); ok(L3.delay() === 0, "success resets");
let qq = []; for (let i = 0; i < 25; i++) qq = C.enqueue(qq, i, 20); ok(qq.length === 20 && qq[0] === 5 && qq[19] === 24, "queue cap keeps the newest 20");
ok(C.decideEnabled({}) === true, "default on");
ok(C.decideEnabled({gpc: true}) === false && C.decideEnabled({dnt: true}) === false, "GPC / DNT default off");
ok(C.decideEnabled({stored: "on", gpc: true}) === true && C.decideEnabled({stored: "off"}) === false, "explicit choice wins");

// ---- build id
const bid = require("../build-id.js");
const id1 = bid.idOf(s), stamped = bid.stamp(s);
ok(/^\d+\.\d+\.\d+\+[0-9a-f]{12}$/.test(id1), id1);
ok(bid.idOf(stamped) === id1 && stamped.includes(`const BUILD_ID = "${id1}";`) && stamped.split("\n").length === s.split("\n").length, "stamping keeps the id and the line count");
ok(bid.idOf(stamped + " ") !== id1, "any content change changes the id");
ok(/const APP_VERSION = "([^"]+)"/.exec(s)[1] === JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version, "APP_VERSION matches package.json");
ok(/ERROR_REPORTING = \{\s*dsn: "",/.test(s), "shipped with an empty DSN (nothing is sent until the owner pastes one)");

// ---- no SDK, no third-party script in the reporter
const mod = s.slice(s.indexOf("/* ===== module: 49-errreport.js"), s.indexOf("/* ===== module: 49-apptour.js"));
ok(!/Sentry\.init|@sentry|browser\.sentry-cdn/.test(mod.replace(/\/\*[\s\S]*?\*\//g, "")), "no SDK");
ok(/ERROR_REPORTING = \{[^}]*release: APP_VERSION/.test(mod), "release tagged");

// ---- main.js: the Electron main-process reporter, run against fake Electron / https objects (no Electron needed)
{
  const ms = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const blk = ms.slice(ms.indexOf("// ---------- Crash and error reports for the main process"), ms.indexOf("// \"Keep Running in the Background\" is on unless"));
  ok(blk.length > 1500, "main.js block found");
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "sb-main-"));
  const appDir = path.join(tmp, "app"); fs.mkdirSync(appDir);
  fs.writeFileSync(path.join(appDir, "errreport-core.js"), code + "\nmodule.exports = ERRCORE;\n");
  fs.writeFileSync(path.join(appDir, "error-config.json"), JSON.stringify({dsn: "https://0123456789abcdef0123456789abcdef@o4501.ingest.sentry.io/4507001", release: "1.13.0", environment: "production", build: "1.13.0+abc123def456", minidump: ""}));
  const posts = [], handlers = {proc: {}, app: {}, ipc: {}}, shown = [];
  const fakeHttps = {request: (opt, cb) => { const rec = {opt, body: ""}; posts.push(rec); const r = {on: () => r, end: b => { rec.body = b; cb({statusCode: 200, resume() {}}); }, destroy() {}}; return r; }};
  const mk = (cfgObj) => {
    const cfgRef = cfgObj, proc = {on: (e, f) => { handlers.proc[e] = f; }};
    new Function("require", "process", "app", "ipcMain", "dialog", "fs", "path", "APP_DIR", "IS_MAS", "cfg", "readCfg", "fromMain", "writeCfgSoon", "console", blk)(
      m => m === "https" ? fakeHttps : m === "os" ? Object.assign({}, require("os"), {homedir: () => "/home/jane"}) : m === "electron" ? {crashReporter: {start() { throw new Error("must not start"); }}} : require(m),
      proc, {on: (e, f) => { handlers.app[e] = f; }, isReady: () => true, getVersion: () => "1.13.0"}, {on: (e, f) => { handlers.ipc[e] = f; }}, {showErrorBox: (...a) => shown.push(a)},
      fs, path, appDir, false, cfgRef, () => ({}), () => true, () => {}, {error() {}});
    return cfgRef;
  };
  // never turned on by the page: nothing is sent
  let c = mk({}); const boom = new Error("EACCES /home/jane/Documents/Bio notes.docx for jane@school.edu");
  boom.stack = "Error: x\n    at readIt (/home/jane/app/main.js:10:5)\n    at Object.<anonymous> (/opt/Studyboard/resources/app.asar/main.js:99:1)";
  handlers.proc.uncaughtException(boom);
  ok(posts.length === 0 && shown.length === 1, "off until the page says on; Electron's error box is still shown");
  handlers.ipc["crash:set"]({}, true); ok(c.crashReports === true, "page turned it on");
  handlers.proc.uncaughtException(boom);
  ok(posts.length === 1 && posts[0].opt.hostname === "o4501.ingest.sentry.io" && posts[0].opt.path.startsWith("/api/4507001/envelope/?sentry_key="), JSON.stringify(posts[0] && posts[0].opt));
  const em = posts[0].body.split("\n"), evm = JSON.parse(em[2]);
  ok(JSON.parse(em[0]).event_id === evm.event_id && JSON.parse(em[1]).type === "event" && evm.tags.platform === "electron" && evm.tags.process === "main" && evm.tags.kind === "main-uncaught", "main-process envelope");
  ok(!/jane|school\.edu|Bio notes|\/home|\/opt/.test(posts[0].body), "no paths or personal data: " + (posts[0].body.match(/.{40}(jane|school\.edu|Bio notes|\/home|\/opt).{40}/) || [""])[0]);
  handlers.app["render-process-gone"]({}, {}, {reason: "crashed", exitCode: 5}); ok(posts.length === 2 && JSON.parse(posts[1].body.split("\n")[2]).exception.values[0].type === "RenderProcessGone", "renderer crash");
  handlers.app["render-process-gone"]({}, {}, {reason: "clean-exit", exitCode: 0}); ok(posts.length === 2, "clean exits are not crashes");
  handlers.app["child-process-gone"]({}, {type: "GPU", reason: "launch-failed", exitCode: 1}); ok(posts.length === 3, "child process gone");
  handlers.app["gpu-process-crashed"]({}, false); ok(posts.length === 4, "gpu-process-crashed (older Electron)");
  handlers.proc.unhandledRejection(new TypeError("late failure")); ok(posts.length === 5, "unhandled rejection");
  handlers.ipc["crash:set"]({}, false); ok(c.crashReports === false && !("crashId" in c), "turned off: id forgotten");
  handlers.proc.uncaughtException(new Error("after off")); ok(posts.length === 5, "nothing sent after the page turned it off");
  // no DSN configured: nothing is sent even when on
  fs.writeFileSync(path.join(appDir, "error-config.json"), JSON.stringify({dsn: ""}));
  c = mk({crashReports: true}); const before = posts.length; handlers.proc.uncaughtException(new Error("no dsn")); ok(posts.length === before, "empty DSN sends nothing from the main process either");
}

(async () => {
  // ---- the error-ingest schema check (Node 22.6+ loads .ts when asked)
  try {
    const m = await import(require("url").pathToFileURL(path.join(root, "supabase-functions/error-ingest/index.ts")).href);
    const good = m.validate({v: 1, event: ev}, ctx.now);
    ok(good.ok && good.row.fingerprint === ev.fingerprint[0] && good.row.platform === "pwa" && good.row.pro === true && good.row.anon_id === "0123456789abcdef", JSON.stringify(good));
    ok(!JSON.stringify(good).includes("jane"), "row has no personal data");
    ok(!m.validate({event: {}}, 0).ok && !m.validate("x", 0).ok && !m.validate({event: Object.assign({}, ev, {event_id: "short"})}, 0).ok, "refuses malformed events");
    const evil = JSON.parse(JSON.stringify(ev)); evil.exception.values[0].value = "mail jane@x.com key AIzaSyA1234567890abcdefghijklmnop"; evil.breadcrumbs.values.push({category: "act", message: "Buy milk now", timestamp: 1}); evil.tags.pro = "yes; drop table";
    const bad = m.validate(evil, ctx.now);
    ok(bad.ok && !/jane|AIza/.test(bad.row.message) && bad.row.crumbs.every(c => c.message !== "Buy milk now") && bad.row.tags.pro === "yesdroptable" && bad.row.pro === false, JSON.stringify(bad));
    const calls = [];
    const dep = (allow, ins = 201) => ({env: k => ({SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k"})[k] || "", now: () => ctx.now, log: () => {},
      fetch: async (url, init) => { calls.push(String(url)); return /rpc\/client_errors_allow/.test(url) ? new Response(JSON.stringify(allow)) : new Response("", {status: ins}); }});
    const post = (body, d, extra = {}) => m.handle(new Request("https://f/error-ingest", Object.assign({method: "POST", body: typeof body === "string" ? body : JSON.stringify(body)}, extra)), d);
    ok((await post({v: 1, event: ev}, dep(true))).status === 202, "accepted");
    ok(calls.some(u => /client_errors\?on_conflict=event_id/.test(u)), "inserted");
    calls.length = 0;
    ok((await post({v: 1, event: ev}, dep(false))).status === 429 && !calls.some(u => /client_errors\?/.test(u)), "rate limited: nothing stored");
    ok((await post("x".repeat(30000), dep(true))).status === 413, "size cap");
    ok((await post("{nope", dep(true))).status === 400 && (await post({event: {}}, dep(true))).status === 400, "bad input");
    ok((await m.handle(new Request("https://f/e", {method: "GET"}), dep(true))).status === 405, "POST only");
    ok((await m.handle(new Request("https://f/e", {method: "OPTIONS"}), dep(true))).status === 204, "CORS preflight");
  } catch (e) { if (e && e.code === "ERR_UNKNOWN_FILE_EXTENSION") console.log("skipped error-ingest checks (Node too old for .ts; use node --experimental-strip-types)"); else throw e; }
  console.log("error-report tests passed (" + n + " checks)");
})().catch(e => { console.error(e); process.exit(1); });
