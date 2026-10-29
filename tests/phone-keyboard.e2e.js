// node tests/phone-keyboard.e2e.js: typing on a phone. With the on-screen keyboard up (simulated by shrinking the visual
// viewport like iOS does), sheets sit above it and the bottom bars step aside; in the companion chat the profile card slides
// up into a slim title bar while you type (the live companion fades out) and slides back when you're done.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), KB = 336;
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
    const seed = {v: 2, updated: 1, settings: {}, courses: [], tasks: [], notes: []};
    await ctx.addInitScript(s => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); localStorage.setItem("studyboard:comp:chats", JSON.stringify([{id: "ch1", title: "Grades", at: Date.now(), msgs: [{q: "How am I doing?", at: 1, a: {answer: Array.from({length: 30}, (_, i) => "Line " + (i + 1) + " of a long answer.").join("\\n\\n"), sources: ["Course Grades: BSNC 1055", "Notes"], followUps: [], actions: []}}]}])); } } catch (e) {} }, seed);
    await ctx.addInitScript(KB => { let open = false; const vv = window.visualViewport; Object.defineProperty(vv, "height", {configurable: true, get: () => innerHeight - (open ? KB : 0)}); window.__kb = on => { open = on; vv.dispatchEvent(new Event("resize")); }; }, KB);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    const vis = sel => page.evaluate(sel => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).visibility !== "hidden"; }, sel);

    // a sheet with the keyboard up
    await page.evaluate(() => { window.__sbSync.ui.tab = "tasks"; window.__sbSync.render(); });
    await page.click("#fab"); await page.waitForSelector("dialog#dlg[open] input");
    await page.evaluate(() => { document.querySelector("dialog#dlg[open] input").focus(); window.__kb(true); }); await page.waitForTimeout(300);
    const d = await page.evaluate(() => { const r = document.getElementById("dlg").getBoundingClientRect(); return {top: r.top, bottom: r.bottom, vh: visualViewport.height}; });
    ok(d.bottom <= d.vh + 1 && d.top >= 0, "the New Task sheet sits fully above the keyboard: " + JSON.stringify(d));
    ok(!(await vis("nav.tabs")) && !(await vis("#fab")), "the tab bar and the add button step aside while the keyboard is up");
    await page.evaluate(() => { window.__kb(false); document.getElementById("dlg").close(); }); await page.waitForTimeout(200);
    ok(await vis("nav.tabs"), "and come back when it closes");

    // the companion chat
    await page.evaluate(() => { window.__sbSync.ui.tab = "companion"; window.__sbSync.render(); }); await page.waitForSelector("#cptIn"); await page.waitForTimeout(900);
    const card = () => page.evaluate(() => { const h = document.querySelector(".cpt-head.cpt3"), f = document.querySelector(".cpt-face-slot").getBoundingClientRect(), log = document.getElementById("cptLog");
      const sp = [...document.querySelectorAll("[data-px]")].map(e => e.getBoundingClientRect()).find(r => r.width > 30);
      const fr = document.querySelector(".cp-front"); return {h: Math.round(h.getBoundingClientRect().height), mini: getComputedStyle(document.querySelector(".cpt3-mini b")).opacity, sprite: fr ? getComputedStyle(fr).opacity : "1", log: Math.round(log.getBoundingClientRect().height), tabs: getComputedStyle(document.querySelector(".cpt3-tabs")).opacity, off: sp ? Math.round(Math.hypot(sp.left + sp.width / 2 - (f.left + f.width / 2), sp.top + sp.height / 2 - (f.top + f.height / 2))) : null}; });
    await page.evaluate(() => { window.__sbSync.ui.cpt.id = "ch1"; window.__sbSync.render(); }); await page.waitForTimeout(400);
    const top = await page.evaluate(() => { const log = document.getElementById("cptLog"), q = [...log.querySelectorAll(".cpt-q")].pop(); return {d: Math.round(q.getBoundingClientRect().top - log.getBoundingClientRect().top), st: log.scrollTop, max: log.scrollHeight - log.clientHeight}; });
    ok(top.d >= 0 && top.d < 40 && top.st < top.max - 100, "a long answer opens at its start, its question at the top of the chat: " + JSON.stringify(top));
    const src = await page.evaluate(() => { const d = document.querySelector(".cpt-a details.cpt-srcd"); return d ? {open: d.open, label: d.querySelector("summary").textContent.trim(), chips: d.querySelectorAll(".chip").length} : null; });
    ok(src && !src.open && src.label === "Looked at 2 things" && src.chips === 2, "what it looked at sits in a closed dropdown: " + JSON.stringify(src));
    await page.evaluate(() => { window.__sbSync.ui.cpt.id = null; window.__sbSync.render(); }); await page.waitForTimeout(500);
    const before = await card();
    await page.focus("#cptIn"); await page.evaluate(() => window.__kb(true)); await page.waitForTimeout(600);
    const typing = await card();
    ok(await page.evaluate(() => document.documentElement.classList.contains("cpt-typing")), "typing in the chat box folds the profile card");
    ok(typing.h <= 60 && typing.tabs === "0" && typing.mini === "1", "the card becomes a slim title bar with the companion's face and name: " + before.h + "px -> " + typing.h + "px");
    ok(typing.sprite === "0", "the big live companion fades out meanwhile");
    const ib = await page.evaluate(() => document.getElementById("cptIn").getBoundingClientRect().bottom);
    ok(ib <= 874 - KB, "the chat box is above the keyboard (" + Math.round(ib) + " <= " + (874 - KB) + ")");
    await page.evaluate(() => { document.getElementById("cptIn").blur(); window.__kb(false); }); await page.waitForTimeout(1100);
    const after = await card();
    ok(!(await page.evaluate(() => document.documentElement.classList.contains("cpt-typing"))) && Math.abs(after.h - before.h) <= 2, "done typing, the card unfolds again (" + after.h + "px)");
    ok(after.off !== null && after.off <= 8 && after.sprite === "1" && after.mini === "0", "with the companion back in its circle (" + after.off + "px off)");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    await ctx.close();
    console.log("\nphone-keyboard.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
