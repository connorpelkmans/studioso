// node tests/extension-popup.e2e.js: the School Sync popup (extension/src/popup.js) against a stand-in background.
// While a sync runs it only updates the status lines (a connect form being filled in is never wiped), it stops polling when
// nothing is syncing or a sync looks stuck, the disclosure names the chosen interval, every platform can be connected, and a
// second school on the same platform asks before replacing the first.
const assert = require("assert"); let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("./pw");
const SRC = path.join(__dirname, "..", "extension", "src");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png"};
const server = http.createServer((req, res) => { const p = decodeURIComponent(new URL(req.url, "http://x").pathname); const f = path.join(SRC, p); if (!f.startsWith(SRC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
// the background, as far as the popup sees it
function stub(state) {
  window.__state = state; window.__sent = [];
  window.__studyboardExt = {originOf: s => { try { const u = new URL(/^https?:/.test(s) ? s : "https://" + s); return u.protocol === "https:" ? u.origin : null; } catch (e) { return null; } }};
  window.chrome = {runtime: {sendMessage: async m => { window.__sent.push(m); const S = window.__state;
      if (m.op === "status") return JSON.parse(JSON.stringify({schools: S.schools, settings: S.settings, status: S.status, version: "1.0.0", conflict: S.conflict || null}));
      if (m.op === "add") { if (S.schools.canvas && !m.replace && /college/.test(m.origin)) return {error: "exists", id: "canvas", old: S.schools.canvas.origin, origin: m.origin}; S.schools.canvas = {id: "canvas", origin: m.origin}; return {ok: true, id: "canvas"}; }
      return {ok: true}; }},
    tabs: {query: async () => [], create: () => {}}, permissions: {request: async () => true}};
}
const now = Date.now();
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  const open = async state => {
    const ctx = await b.newContext({viewport: {width: 360, height: 600}}); await ctx.addInitScript(stub, state);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/popup.html"); await page.waitForSelector("#main > *", {state: "attached"}); await page.waitForTimeout(150);
    return {ctx, page, errs, statusCalls: () => page.evaluate(() => window.__sent.filter(m => m.op === "status").length)};
  };
  try {
    { const {ctx, page, errs, statusCalls} = await open({schools: {canvas: {id: "canvas", origin: "https://school.instructure.com"}}, settings: {every: 180, on: true}, status: {canvas: {state: "syncing", since: now}}});
      ok(/Syncing now/.test(await page.textContent("li.school")), "a running sync shows on the card");
      await page.click("details.more summary"); await page.fill("#addr", "brightspace.example.edu"); await page.evaluate(() => { window.__addr = document.getElementById("addr"); });
      await page.waitForTimeout(5600);
      ok(await page.evaluate(() => document.getElementById("addr") === window.__addr && window.__addr.value === "brightspace.example.edu" && document.querySelector("details.more").open), "while it syncs, the address being typed stays as it is (the popup isn't redrawn)");
      ok(/about every 3 hours,/.test(await page.textContent("#disclose")), "the disclosure names the chosen interval: every 3 hours");
      await page.evaluate(() => { window.__state.status.canvas = {state: "ok", at: Date.now(), lastOk: Date.now(), courses: 2, items: 5, grades: 1}; });
      await page.waitForTimeout(2800);
      ok(/Synced just now/.test(await page.textContent("li.school")) && await page.evaluate(() => document.getElementById("addr") === window.__addr), "when it finishes the card says so, and the form is still the same one");
      const c1 = await statusCalls(); await page.waitForTimeout(5500);
      ok(await statusCalls() === c1, "with nothing syncing the popup stops asking");
      await page.selectOption(".settings select", "15");
      ok(/about every 15 minutes,/.test(await page.textContent("#disclose")), "changing the interval updates the disclosure");
      ok(!errs.length, "no page errors: " + errs.join("; "));
      await ctx.close(); }
    { const {ctx, page, statusCalls} = await open({schools: {canvas: {id: "canvas", origin: "https://school.instructure.com"}}, settings: {every: 60, on: true}, status: {canvas: {state: "syncing", since: now - 6 * 60000}}});
      const c1 = await statusCalls(); await page.waitForTimeout(5500);
      ok(await statusCalls() === c1, "a sync stuck for over 5 minutes isn't polled forever");
      await ctx.close(); }
    { const S = {canvas: {id: "canvas", origin: "https://school.instructure.com"}, brightspace: {id: "brightspace", origin: "https://d2l.example.edu"}, blackboard: {id: "blackboard", origin: "https://bb.example.edu"}};
      const {ctx, page} = await open({schools: S, settings: {every: 60, on: true}, status: {}});
      ok(await page.locator("form.connect").count() === 1, "with three platforms connected, the fourth (Moodle) can still be connected");
      // a second Canvas
      await page.click("details.more summary"); await page.fill("#addr", "college.instructure.com"); await page.click("form.connect button[type=submit]");
      await page.waitForSelector('.confirm[aria-label="Replace Canvas"]');
      ok(/already syncs Canvas from school\.instructure\.com/.test(await page.textContent(".confirm")) && await page.evaluate(() => window.__state.schools.canvas.origin) === "https://school.instructure.com", "a second Canvas asks before replacing the first, and nothing changed yet");
      await page.click('.confirm button.primary'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => window.__state.schools.canvas.origin === "https://college.instructure.com" && window.__sent.some(m => m.op === "add" && m.replace === true)), "Switch replaces it");
      await ctx.close(); }
    { const {ctx, page} = await open({schools: {canvas: {id: "canvas", origin: "https://school.instructure.com"}}, settings: {every: 60, on: true}, status: {}, conflict: {id: "canvas", old: "https://school.instructure.com", origin: "https://college.instructure.com"}});
      ok(await page.locator('.confirm[aria-label="Replace Canvas"]').count() === 1, "Firefox: a question left by the background is asked when the popup opens");
      await page.click('.confirm button:not(.primary)'); await page.waitForTimeout(200);
      ok(await page.evaluate(() => window.__sent.some(m => m.op === "keep" && m.origin === "https://college.instructure.com") && window.__state.schools.canvas.origin === "https://school.instructure.com"), "Keep leaves the first school connected");
      await ctx.close(); }
  } finally { await b.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
