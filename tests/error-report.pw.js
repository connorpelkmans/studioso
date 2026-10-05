// Browser tests for crash/error reporting with a mock Sentry endpoint (no network). Run: node tests/error-report.pw.js
// Needs Playwright + Chromium (see tests/pw.js for how Playwright and Chromium are found).
const fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const DSN = "https://0123456789abcdef0123456789abcdef@o4501.ingest.sentry.io/4507001";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-err-"));
const page = (name, patch) => { const f = path.join(dir, name + "/index.html"); fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, patch(src)); return "file://" + f; };
const withDsn = s => s.replace('dsn: "",', `dsn: "${DSN}",`);
const URLS = {on: page("on", withDsn), off: page("off", s => s), fb: page("fb", s => s.replace("supabaseFallback: false", "supabaseFallback: true"))};
// Personal content that must never appear in any payload.
const SEED = {courses: [{id: "c1", name: "Organic Chemistry 301", code: "CHEM301", color: "#3B6FE0"}],
  tasks: [{id: "t1", title: "Study for Dr. Patel's oncology exam", courseId: "c1", type: "Exam", due: "2026-10-20", status: "todo", notes: "bring flashcards for Mrs. Hendricks"}],
  files: [], notes: [], decks: [], events: [], settings: {capacity: 15}};
const PII = ["Patel", "oncology", "Hendricks", "Organic Chemistry", "CHEM301", "jane.student@school.edu", "AIzaSyA1234567890abcdefghijklmnopq"];
const PII_MSG = "Cannot render \"Study for Dr. Patel's oncology exam\" for jane.student@school.edu with key AIzaSyA1234567890abcdefghijklmnopq in Organic Chemistry 301";
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, url, o = {}) {
  const ctx = await browser.newContext(o.ctx || {});
  await ctx.addInitScript(([seed, extra]) => {
    try { if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(Object.assign({v: 2}, seed))); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); } catch (e) {}
    window.__csp = []; document.addEventListener("securitypolicyviolation", e => window.__csp.push(e.violatedDirective + " " + e.blockedURI));
    if (extra) eval(extra);
  }, [SEED, o.init || ""]);
  const sent = [], other = [];
  const status = o.status || 200;
  await ctx.route(/^https?:\/\//, route => {
    const r = route.request(), u = r.url();
    const cors = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS"};
    if (/ingest\.sentry\.io|\/functions\/v1\/error-ingest/.test(u)) {
      if (r.method() === "OPTIONS") return route.fulfill({status: 204, headers: cors});
      sent.push({url: u, method: r.method(), headers: r.headers(), body: r.postData() || ""});
      return route.fulfill({status, headers: cors, body: "{}"});
    }
    other.push(u); return route.fulfill({status: 404, body: ""});
  });
  const p = await ctx.newPage();
  await p.goto(url); await p.waitForFunction(() => window.SBERR, null, {timeout: 20000}); await sleep(300);
  return {ctx, p, sent, other};
}
// Throws from an inline script in the page itself, so the stack points at index.html like a real app error (an evaluate() frame would be "third-party").
const inject = (p, js) => p.evaluate(j => { const s = document.createElement("script"); s.textContent = j; document.head.appendChild(s); s.remove(); }, js);
const boom = (p, msg = PII_MSG) => inject(p, `setTimeout(function boomFn(){ throw new Error(${JSON.stringify(msg)}); }, 0);`);
const parseEnv = body => { const l = body.split("\n"); return {head: JSON.parse(l[0]), item: JSON.parse(l[1]), ev: JSON.parse(l[2]), n: l.length}; };
const noPII = (blob, why) => PII.forEach(x => ok(!blob.includes(x), `${why}: payload leaks ${x}`));

(async () => {
  const browser = await chromium.launch({executablePath, args: ["--no-sandbox"]});
  try {
    // 1. An injected error is sent to the Sentry envelope endpoint, scrubbed, and the page shows no CSP violations.
    {
      const t = await open(browser, URLS.on, {init: "Math.random = () => 0.25"});   // console errors are sampled 50%: make the dice deterministic
      await t.p.click("body"); await boom(t.p); await sleep(1200);
      ok(t.sent.length === 1, "one event sent, got " + t.sent.length);
      const s = t.sent[0], e = parseEnv(s.body);
      ok(s.method === "POST" && s.url === "https://o4501.ingest.sentry.io/api/4507001/envelope/?sentry_key=0123456789abcdef0123456789abcdef&sentry_version=7&sentry_client=studyboard-errreport%2F1", s.url);
      ok(/^text\/plain/.test(s.headers["content-type"]) && !s.headers.authorization && !s.headers.cookie && !s.headers["x-sentry-auth"], "simple request, no credentials: " + JSON.stringify(s.headers));
      ok(e.n === 4 && e.head.dsn === DSN && /^[0-9a-f]{32}$/.test(e.head.event_id) && e.head.event_id === e.ev.event_id && !isNaN(Date.parse(e.head.sent_at)) && e.item.type === "event" && e.item.length === Buffer.byteLength(s.body.split("\n")[2]), "envelope shape");
      ok(e.ev.release === "1.13.0" && e.ev.environment === "production" && e.ev.tags.platform === "web" && e.ev.tags.pro && e.ev.tags.theme && e.ev.exception.values[0].type === "Error" && e.ev.exception.values[0].stacktrace.frames.some(f => f["function"] === "boomFn" && f.lineno > 0), JSON.stringify(e.ev).slice(0, 600));
      ok(/^[0-9a-f]{16}$/.test(e.ev.user.id) && Object.keys(e.ev.user).length === 1, "anonymous id only");
      ok(e.ev.tags.build === "dev", "build id tag present");
      noPII(s.body, "scrubbed event"); ok(!/file:|\/home\/|\/tmp\//.test(s.body), "no file paths in payload: " + s.body.match(/.{30}(file:|\/home\/|\/tmp\/).{30}/));
      ok((await t.p.evaluate(() => window.__csp)).length === 0, "CSP violations: " + JSON.stringify(await t.p.evaluate(() => window.__csp)));
      // breadcrumbs hold only whitelisted actions; a click on a typed-text control adds nothing
      await t.p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "Delete Physics lab report!"; b.id = "badAct"; document.body.appendChild(b); const g = document.createElement("button"); g.dataset.act = "bug-open"; g.id = "goodAct"; document.body.appendChild(g); });
      await t.p.evaluate(() => { document.getElementById("badAct").click(); document.getElementById("goodAct").click(); });
      await inject(t.p, `window.SBERR.flow("sync", new Error("Save failed for Study for Dr. Patel's oncology exam"), {tags: {code: "unavailable"}});`); await sleep(1200);
      const f = parseEnv(t.sent[t.sent.length - 1].body).ev;
      ok(f.tags.kind === "flow-sync" && f.breadcrumbs.values.some(c => c.category === "act" && c.message === "bug-open") && !f.breadcrumbs.values.some(c => /Delete|Physics/.test(c.message)), JSON.stringify(f.breadcrumbs));
      noPII(JSON.stringify(f), "flow event");
      // ignored noise is never sent
      const before = t.sent.length;
      await inject(t.p, `setTimeout(function ro(){ throw new Error("ResizeObserver loop completed with undelivered notifications."); }, 0); setTimeout(function ab(){ const e = new Error("The user aborted a request."); e.name = "AbortError"; Promise.reject(e); }, 0);`);
      await sleep(800); ok(t.sent.length === before, "benign errors ignored");
      // console.error is reported, with free text redacted
      await inject(t.p, `console.error(new TypeError(${JSON.stringify(PII_MSG)}))`); await sleep(1000);
      ok(t.sent.length === before + 1 && t.sent[t.sent.length - 1].body.includes("TypeError"), "console.error Error reported"); noPII(t.sent[t.sent.length - 1].body, "console event");
      // the ring buffer still gets the error (the bug-report form attaches it)
      ok(await t.p.evaluate(() => { const e = window.SBFEEDBACK.diagnostics().errors; return e.length > 0 && e.some(x => /Cannot render|Save failed|TypeError|sync/.test(x.m)) && e.every(x => !/jane\.student|AIza/.test(x.m)); }), "ERRLOG still has scrubbed copies for the bug-report form");
      ok(await t.p.evaluate(() => window.SBFEEDBACK.diagnostics().build === "dev"), "bug report diagnostics carry the build");
      await t.ctx.close();
    }
    // 2. Rate limit: the same error over and over is sent at most 3 times an hour.
    {
      const t = await open(browser, URLS.on);
      await inject(t.p, `for (let i = 0; i < 12; i++) setTimeout(function sameSpot() { throw new Error("same bug " + i); }, i * 20);`);
      await sleep(1800); ok(t.sent.length >= 1 && t.sent.length <= 3, "same fingerprint capped: " + t.sent.length);
      await t.ctx.close();
    }
    // 3. Empty DSN: nothing is ever sent (and nothing is queued), but the local ring buffer still has it.
    {
      const t = await open(browser, URLS.off);
      await boom(t.p); await sleep(1000);
      ok(t.sent.length === 0 && t.other.every(u => !/sentry|error-ingest/.test(u)), "empty DSN sends nothing");
      ok(await t.p.evaluate(() => !window.SBERR.configured() && window.SBERR.pending() === 0 && !localStorage.getItem("studyboard:errq")), "nothing queued");
      ok(await t.p.evaluate(() => window.SBFEEDBACK.diagnostics().errors.some(x => /Cannot render/.test(x.m))), "ring buffer still captured");
      await t.ctx.close();
    }
    // 4. The Settings toggle: turn off, nothing sent, it persists across a reload; turn on again.
    {
      const t = await open(browser, URLS.on);
      const st = () => t.p.evaluate(() => ({on: window.SBERR.enabled(), pref: localStorage.getItem("studyboard:errrep"), id: localStorage.getItem("studyboard:errid"), btn: (document.querySelector('[data-act="errrep-toggle"]') || {}).ariaChecked}));
      const openSettings = async () => { await t.p.evaluate(() => document.querySelector('[data-act="menu"]').click()); await t.p.waitForSelector('[data-act="errrep-toggle"]', {state: "attached"}); };
      await boom(t.p, "first one"); await sleep(900);
      ok(t.sent.length === 1 && (await st()).on && /^[0-9a-f]{16}$/.test((await st()).id), "default on, anonymous id created");
      await openSettings(); ok((await st()).btn === "true", "switch shows on");
      await t.p.evaluate(() => document.querySelector('[data-act="errrep-toggle"]').click()); await sleep(400);
      let s1 = await st(); ok(!s1.on && s1.pref === "off" && s1.id === null, "off: preference saved, anonymous id forgotten " + JSON.stringify(s1));
      await boom(t.p, "after off"); await sleep(900); ok(t.sent.length === 1, "nothing sent while off");
      await t.p.reload(); await t.p.waitForFunction(() => window.SBERR); await sleep(300);
      ok(!(await st()).on, "off persists across a reload");
      await boom(t.p, "after reload"); await sleep(900); ok(t.sent.length === 1, "still nothing sent after reload");
      await openSettings(); ok((await st()).btn === "false", "switch shows off after reload");
      await t.p.evaluate(() => document.querySelector('[data-act="errrep-toggle"]').click()); await sleep(400);
      ok((await st()).on && (await st()).pref === "on", "on again");
      await boom(t.p, "after on again"); await sleep(900); ok(t.sent.length === 2, "sending again: " + t.sent.length);
      await t.ctx.close();
    }
    // 5. Do Not Track and Global Privacy Control default it off; an explicit choice still wins.
    for (const [name, init] of [["DNT", "Object.defineProperty(navigator,'doNotTrack',{get:()=>'1'})"], ["GPC", "Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true})"]]) {
      const t = await open(browser, URLS.on, {init});
      ok(await t.p.evaluate(() => !window.SBERR.enabled()), name + " defaults off");
      await boom(t.p); await sleep(900); ok(t.sent.length === 0, name + ": nothing sent");
      await t.p.evaluate(() => window.SBERR.setEnabled(true)); await boom(t.p, "chosen on"); await sleep(900);
      ok(t.sent.length === 1, name + ": explicit opt-in sends");
      await t.ctx.close();
    }
    // 6. Offline queue: kept (max 20) while offline, flushed when the connection returns, never blocking.
    {
      const t = await open(browser, URLS.on);
      await t.ctx.setOffline(true); await sleep(200);
      await inject(t.p, `function f0(){ throw new Error("offline bug 0"); } function f1(){ throw new Error("offline bug 1"); } function f2(){ throw new Error("offline bug 2"); } setTimeout(f0, 0); setTimeout(f1, 0); setTimeout(f2, 0);`);
      await sleep(600);
      ok(t.sent.length === 0 && (await t.p.evaluate(() => window.SBERR.pending())) === 3 && JSON.parse(await t.p.evaluate(() => localStorage.getItem("studyboard:errq"))).length === 3, "queued while offline");
      await t.ctx.setOffline(false); await sleep(4500);
      ok(t.sent.length === 3 && (await t.p.evaluate(() => window.SBERR.pending())) === 0, "flushed on online: " + t.sent.length);
      noPII(t.sent.map(x => x.body).join(""), "queued events");
      // a server that keeps failing triggers back-off instead of a request storm
      await t.ctx.close();
      const t2 = await open(browser, URLS.on, {status: 500});
      await boom(t2.p, "server down one"); await sleep(1200); const c1 = t2.sent.length;
      await boom(t2.p, "server down two"); await sleep(2500);
      ok(c1 === 1 && t2.sent.length === 1 && (await t2.p.evaluate(() => window.SBERR.pending())) === 2, "back-off after a failure: " + t2.sent.length);
      await t2.ctx.close();
      // a refused (wrong) DSN is dropped, and after three refusals reporting stops for the session
      const t3 = await open(browser, URLS.on, {status: 403});
      for (let i = 0; i < 5; i++) { await inject(t3.p, `setTimeout(function g${i}x(){ throw new Error("refused ${i}"); }, 0);`); await sleep(500); }
      ok(t3.sent.length === 3 && (await t3.p.evaluate(() => window.SBERR.pending())) === 0, "stops after 3 refusals: " + t3.sent.length);
      await t3.ctx.close();
    }
    // 7. Self-hosted fallback: no DSN, supabaseFallback true: the Supabase function gets the scrubbed event; with it false (case 3) nothing is sent.
    {
      const t = await open(browser, URLS.fb);
      await boom(t.p); await sleep(1200);
      ok(t.sent.length === 1 && /\/functions\/v1\/error-ingest$/.test(t.sent[0].url) && t.sent[0].headers.apikey && !t.sent[0].headers.authorization, "fallback endpoint: " + JSON.stringify(t.sent.map(x => x.url)));
      const b = JSON.parse(t.sent[0].body); ok(b.v === 1 && b.event.exception && b.event.user.id, "fallback body"); noPII(t.sent[0].body, "fallback payload");
      await t.ctx.close();
    }
    // 8. The privacy sheet and onboarding disclose it.
    {
      const t = await open(browser, URLS.on);
      const txt = await t.p.evaluate(() => { window.SBLEGAL.privacy(); return document.querySelector(".legal").textContent; });
      ok(/Anonymous crash reports/.test(txt) && /Send Anonymous Crash Reports/.test(txt) && /Do Not Track/.test(txt), "privacy sheet discloses");
      await t.ctx.close();
    }
    console.log("error-report browser tests passed (" + n + " checks)");
  } catch (e) { await browser.close(); throw e; }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
