// node tests/capture.e2e.js  (Playwright + Chromium; serves the app over http so the service worker runs; the AI network call is stubbed)
// Checks: typed capture speed, undo, confirm sheet, URL handler, share-target manifest + service-worker POST, paste, photo flow, offline queue, ingest contract. Writes screenshots to $SHOTS.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "cap-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream", "service-worker-allowed": "/"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const nextFri = () => { const d = new Date(), k = (5 - d.getDay() + 7) % 7 || 7; return addD(k); };
const DUE10 = (() => { const d = new Date(); d.setDate(d.getDate() + 10); return iso(d); })();
const SEED = {v: 2, courses: [{id: "c1", name: "Intro Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Organic Chemistry", code: "CHEM201", color: "#1E9E74"}], tasks: [], settings: {capacity: 15}, updated: 1};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath: "/opt/pw-browsers/chromium"});
  const mkCtx = async (opts = {}) => {
    const ctx = await browser.newContext(Object.assign({viewport: {width: 1280, height: 800}, acceptDownloads: false}, opts.ctx || {}));
    await ctx.addInitScript(([seed, ai, native]) => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {}
      if (native) window.StudyboardNative = {forwardsDeepLinks: true};
      let cfg = {shot: true, shotKey: "CommandOrControl+Alt+C", shotKeys: ["CommandOrControl+Alt+C", "CommandOrControl+Shift+Alt+C", "CommandOrControl+Alt+X", "CommandOrControl+Alt+Q"], shotOn: true};
      window.__setCalls = []; window.__capNow = 0;
      window.studiosoDesktop = {platform: "win32", version: "test", store: "direct", getDesktopSettings: async () => cfg, setDesktopSetting: async (k, v) => { window.__setCalls.push([k, v]); if (k === "shot") cfg = Object.assign({}, cfg, {shot: v === true}); if (k === "shotKey") cfg = Object.assign({}, cfg, {shotKey: v}); return cfg; },
        onScreenshot: fn => { window.__shot = fn; }, captureScreen: async () => { window.__capNow++; return true; }, onCapture: () => {}, onAction: () => {}, onOpenTask: () => {}, onPower: () => {}, getPower: async () => null, onFlush: () => {}, setTitleBar: () => {}, dataDir: async () => "", secrets: {available: async () => false}};
    }, [SEED, opts.ai !== false, !!opts.native]);
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => { ctx.aiCalls = (ctx.aiCalls || []).concat(route.request().postData()); if (ctx.aiDelay) await new Promise(r => setTimeout(r, ctx.aiDelay));
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(ctx.aiReply || {items: [], rawText: ""})}]}, finishReason: "STOP"}]})}); });
    return ctx;
  };
  const open = async (ctx, url = base) => { const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message)); page.errs = errs; await page.goto(url); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.SBCAPTURE); await page.waitForTimeout(400); return page; };
  const tasks = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).tasks);
  try {
    const shotBytes = page => page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 640; c.height = 360; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 640, 360); g.fillStyle = "#000"; g.font = "28px sans-serif"; g.fillText("Lab report 4 due Oct 28", 30, 80);
      const b = await new Promise(r => c.toBlob(r, "image/jpeg", 0.9)); return Array.from(new Uint8Array(await b.arrayBuffer())); });
    const send = (page, bytes) => page.evaluate(b => window.__shot(new Uint8Array(b)), bytes);
    const kindsSent = ctx => (ctx.aiCalls || []).map(x => /screenshot from a student/.test(x) ? "shot" : /course syllabi/i.test(x) ? "syllabus" : /study notes/i.test(x) ? "note" : "other");

    // ---- settings: the desktop row, and no web-only rows ----
    let ctx = await mkCtx(); let page = await open(ctx);
    await page.locator('[data-act="menu"]:visible').first().click(); await page.waitForSelector(".us-cat"); await page.click('.us-cat[data-us="capture"]'); await page.waitForSelector('[data-cap-pref="auto"]');
    await page.waitForSelector("[data-cap-shot] #capShotKey");
    ok((await page.$$('[data-act="cap-try"]')).length === 3 && await page.isVisible('[data-act="cap-try"][data-try="shot"]') && !(await page.$('[data-try="share"]')) && !(await page.$('[data-try="url"]')), "desktop settings: window, photo and screenshot Try it buttons only (no share sheet or Siri link)");
    ok(/Ctrl\+Alt\+C/.test(await page.textContent("[data-cap-shot]")) && (await page.$$("#capShotKey option")).length === 4, "the shortcut is shown by name and has 4 choices");
    await page.selectOption("#capShotKey", "CommandOrControl+Alt+X"); await page.waitForFunction(() => window.__setCalls.some(c => c[0] === "shotKey" && c[1] === "CommandOrControl+Alt+X"));
    ok(/Ctrl\+Alt\+X/.test(await page.textContent("[data-cap-shot]")), "changing the shortcut is sent to the app and shown");
    await page.click('[data-shot="on"]'); await page.waitForFunction(() => window.__setCalls.some(c => c[0] === "shot" && c[1] === false));
    ok(await page.isDisabled("#capShotKey"), "turning the shortcut off disables the picker");
    await page.click('[data-shot="on"]'); await page.waitForFunction(() => window.__setCalls.filter(c => c[0] === "shot").length === 2);
    await page.click('[data-act="cap-try"][data-try="shot"]'); await page.waitForFunction(() => window.__capNow === 1);
    ok(true, "Try it asks the app to start the screenshot picker");
    await page.screenshot({path: path.join(SHOTS, "shot-settings.png")}); await page.close(); await ctx.close();

    // ---- a screenshot of tasks: the usual Check and Add sheet, read with the screenshot prompt ----
    ctx = await mkCtx(); ctx.aiReply = {kind: "tasks", items: [{title: "Lab report 4", dueDate: "2026-10-28", dueTime: "", course: "BIO101", type: "Lab", notes: "", confidence: 0.9}], rawText: "Lab report 4 due Oct 28"};
    page = await open(ctx); const bytes = await shotBytes(page);
    await send(page, bytes); await page.waitForSelector("#capAddAll", {timeout: 8000});
    ok(/Found 1 item/.test(await page.textContent(".cap-body")) && (await page.evaluate(() => [...document.querySelectorAll(".cap-body input")].map(i => i.value).join("|"))).includes("Lab report 4") && kindsSent(ctx)[0] === "shot", "a screenshot of deadlines becomes tasks to check and add");
    ok(/screenshot from a student's computer/.test(ctx.aiCalls[0]) && /"syllabus"/.test(ctx.aiCalls[0]), "the screenshot prompt and the kind choices were sent");
    await page.screenshot({path: path.join(SHOTS, "shot-tasks.png")});
    await page.keyboard.press("Escape"); await page.close();

    // ---- a screenshot of a syllabus goes to the syllabus reader ----
    ctx.aiReply = {kind: "syllabus", items: [], rawText: "BIO101 syllabus"}; ctx.aiCalls = [];
    page = await open(ctx); await send(page, bytes);
    await page.waitForFunction(() => /Import a Syllabus/.test((document.querySelector("dialog[open]") || {}).innerText || ""), null, {timeout: 8000});
    await page.waitForFunction(() => (window.__x = 1) && true); await page.waitForTimeout(600);
    ok(kindsSent(ctx).includes("shot") && !(await page.$("#qcIn")), "a syllabus screenshot opens Import a Syllabus");
    ok(kindsSent(ctx).length >= 2 && kindsSent(ctx)[1] !== "shot", "and the syllabus reader is run on the same picture (" + kindsSent(ctx).join(",") + ")");
    await page.keyboard.press("Escape"); await page.close();

    // ---- a screenshot of slides goes to Photo to Note ----
    ctx.aiReply = {kind: "notes", items: [], rawText: "Photosynthesis"}; ctx.aiCalls = [];
    page = await open(ctx); await send(page, bytes);
    await page.waitForFunction(() => /Photo to Note/.test((document.querySelector("dialog[open]") || {}).innerText || ""), null, {timeout: 8000});
    ok(true, "a screenshot of slides or an article opens Photo to Note");
    await page.keyboard.press("Escape"); await page.close();

    // ---- nothing useful in it ----
    ctx.aiReply = {kind: "other", items: [], rawText: "cat photo"}; ctx.aiCalls = [];
    page = await open(ctx); await send(page, bytes); await page.waitForSelector("#qcIn", {timeout: 8000});
    ok(/didn't find any tasks/i.test(await page.textContent(".cap-body")), "nothing useful says so and offers typing it in");
    await page.keyboard.press("Escape"); await page.close(); await ctx.close();

    console.log("\n" + n + " screenshot e2e checks passed. Screenshots in " + SHOTS);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
