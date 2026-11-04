// node tests/data-guards.e2e.js (Playwright + Chromium; no network)
// A saved copy in IndexedDB that can't be opened at launch is never saved over; signing out in one tab empties the other tabs;
// Ctrl+Z doesn't throw away changes made after the step it undoes.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const task = (id, title, extra) => Object.assign({id, title, courseId: "c1", type: "Assignment", due: "2026-12-01", start: "2026-11-20", status: "todo", created: 1}, extra);
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2E9A5A"}], tasks: [task("t1", "Lab report"), task("t2", "Essay")], decks: [], files: [], events: [], notes: [], updated: 1, settings: {capacity: 15}};
// The device copy as IndexedDB holds it
const idbCopy = page => page.evaluate(() => new Promise(res => { const q = indexedDB.open("studyboard-sync", 1); q.onsuccess = () => { try { const g = q.result.transaction("rows").objectStore("rows").get("device:v2"); g.onsuccess = () => { q.result.close(); res(g.result || null); }; } catch (e) { res(null); } }; q.onerror = () => res(null); }));

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(seed => {
      window.__SB_TEST = true;
      try {
        localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done");
        if (!localStorage.getItem("seeded")) { localStorage.setItem("seeded", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); }
        // test:hang: opening the device database never finishes, as on a slow iPhone launch
        if (localStorage.getItem("test:hang")) {
          window.__SBC_WAIT = 300;
          const open = indexedDB.open.bind(indexedDB);
          indexedDB.open = function(name, v){ if (name === "studyboard-sync" && localStorage.getItem("test:hang")) return {}; return open(name, v); };
        }
      } catch (e) {}
    }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    const boot = () => page.waitForFunction(() => window.__sbSync && window.__sbSync.state && window.__sbSync.state.courses, null, {timeout: 40000});
    await page.goto(base); await boot();

    // D1: the copy moves to IndexedDB (as a big planner's does), then IndexedDB hangs at the next launch
    await page.evaluate(() => new Promise((res, rej) => { const q = indexedDB.open("studyboard-sync", 1); q.onupgradeneeded = () => { q.result.createObjectStore("rows"); q.result.createObjectStore("backups"); }; q.onsuccess = () => { const tx = q.result.transaction("rows", "readwrite"); tx.objectStore("rows").put(localStorage.getItem("coursework:v2"), "device:v2"); tx.oncomplete = () => { q.result.close(); localStorage.setItem("coursework:v2:idb", String(Date.now())); localStorage.removeItem("coursework:v2"); res(); }; tx.onerror = rej; }; q.onerror = rej; }));
    await page.reload(); await boot();
    ok(await page.evaluate(() => !!window.__sbSync.state.tasks.t2), "the copy in IndexedDB loads normally");
    await page.evaluate(() => localStorage.setItem("test:hang", "1"));
    await page.reload(); await boot();
    await page.waitForFunction(() => /Couldn't open your saved data/.test(document.querySelector("#toastMsg").textContent), null, {timeout: 20000});
    ok(await page.evaluate(() => !Object.keys(window.__sbSync.state.tasks).length && !document.querySelector("#toastExtra").hidden && document.querySelector("#toastExtra").textContent === "Retry"), "a copy that can't be opened shows Couldn't open your saved data, with Retry");
    await page.evaluate(t => window.__sbSync.applyChanges([{kind: "task", id: t.id, after: t}], "Added"), task("t9", "Made while it couldn't open"));
    await page.evaluate(() => new Promise(r => { document.dispatchEvent(new Event("visibilitychange")); setTimeout(r, 800); }));
    await page.evaluate(() => localStorage.removeItem("test:hang"));
    const kept = JSON.parse(await idbCopy(page));
    ok(kept && kept.tasks.length === 2 && !kept.tasks.some(t => t.id === "t9"), "an edit meanwhile doesn't save over the real copy (still 2 tasks)");
    ok(await page.evaluate(() => !localStorage.getItem("coursework:v2")), "and nothing empty is written to localStorage either");
    // Retry (or the retry in the background) finds it readable now
    await page.evaluate(() => { const b = document.querySelector("#toastExtra"); if (b && !b.hidden && b.textContent === "Retry" && document.querySelector("#toast").classList.contains("show")) b.click(); });
    await page.waitForFunction(() => /Reload to see it/.test(document.querySelector("#toastMsg").textContent), null, {timeout: 70000});
    ok(!Object.keys(await page.evaluate(() => window.__sbSync.state.tasks)).includes("t1"), "once it can be read, a reload is offered (an edit was made meanwhile, so nothing is merged silently)");
    await page.reload(); await boot();
    ok(await page.evaluate(() => !!window.__sbSync.state.tasks.t1 && !!window.__sbSync.state.tasks.t2), "after the reload the real copy is all there");

    // D1, no edits meanwhile: once IndexedDB answers, the data just appears
    await page.evaluate(() => localStorage.setItem("test:hang", "1"));
    await page.reload(); await boot();
    await page.waitForFunction(() => /Couldn't open your saved data/.test(document.querySelector("#toastMsg").textContent), null, {timeout: 20000});
    await page.evaluate(() => localStorage.removeItem("test:hang"));
    await page.waitForFunction(() => !!window.__sbSync.state.tasks.t1, null, {timeout: 40000});
    ok(/open again/.test(await page.evaluate(() => window.__sbSync.toastText())), "with nothing changed meanwhile, the background retry loads it by itself");
    await page.evaluate(t => window.__sbSync.applyChanges([{kind: "task", id: t.id, after: t}], "Added"), task("t3", "After it opened"));
    await page.evaluate(() => new Promise(r => { document.dispatchEvent(new Event("visibilitychange")); setTimeout(r, 800); }));
    ok(JSON.parse(await idbCopy(page)).tasks.length === 3, "and saving works again");

    // D6: Ctrl+Z after later changes keeps them
    await page.evaluate(() => { const S = window.__sbSync, t = S.state.tasks.t1; S.applyChanges([{kind: "task", id: "t1", after: Object.assign({}, t, {status: "done"})}], "Marked done"); });
    await page.evaluate(() => { const S = window.__sbSync, t = S.state.tasks.t1; S.applyChanges([{kind: "task", id: "t1", after: Object.assign({}, t, {start: "2026-12-10", due: "2026-12-12"})}], ""); });
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await page.keyboard.press("Control+z");
    const t1 = await page.evaluate(() => window.__sbSync.state.tasks.t1);
    ok(t1.status !== "done" && t1.due === "2026-12-12" && t1.start === "2026-12-10", "Ctrl+Z undoes Done but keeps the dates moved afterwards: " + JSON.stringify({s: t1.status, d: t1.due}));

    // D3: signing out in one tab empties the other open tab, which doesn't save its copy back
    await page.evaluate(() => localStorage.setItem("studioso:owner", "user-1"));
    const other = await ctx.newPage(); other.on("pageerror", e => errs.push(e.message));
    await other.goto(base); await other.waitForFunction(() => window.__sbSync && window.__sbSync.state && window.__sbSync.state.tasks.t1, null, {timeout: 40000});
    await page.evaluate(async () => { localStorage.setItem("studyboard:leaving", String(Date.now())); await window.__sbSync.wipeDeviceData(); });
    await other.waitForFunction(() => window.__sbSync && window.__sbSync.state && !Object.keys(window.__sbSync.state.tasks).length && document.readyState === "complete", null, {timeout: 40000});
    await other.waitForTimeout(1500);
    await other.evaluate(() => new Promise(r => { document.dispatchEvent(new Event("visibilitychange")); setTimeout(r, 800); }));
    const left = await other.evaluate(() => { const c = JSON.parse(localStorage.getItem("coursework:v2") || "{}"); return {items: (c.tasks || []).length + (c.courses || []).length, idb: localStorage.getItem("coursework:v2:idb"), owner: localStorage.getItem("studioso:owner")}; });
    ok(!left.items && !left.idb && left.owner === "none", "the other tab reloaded empty and wrote none of the old data back: " + JSON.stringify(left));
    ok(!(await idbCopy(other)), "the device copy stays erased");
    ok(await other.evaluate(t => { const had = !!localStorage.getItem("studyboard:signedOutWork"); window.__sbSync.applyChanges([{kind: "task", id: t.id, after: t}], "Added"); return !had && localStorage.getItem("studyboard:signedOutWork") === "1"; }, task("t5", "Made while signed out")),
      "work made after signing out is marked as such (the next sign-in offers to add it)");

    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\ndata-guards.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
