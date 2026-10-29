// node tests/sch-swipe.e2e.js: on a phone, swiping the Schedule moves the day with your finger and the next day slides in
// beside it (it doesn't switch only after you let go). Past a third of the way it settles on that day; a short swipe
// springs back; past the end of the week the next week's first day comes in.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, timezoneId: "America/Vancouver"});
    const seed = {v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#4a7", meetings: [{days: [1, 2, 3, 4, 5], start: "10:00", end: "11:00", kind: "lecture"}]}],
      tasks: ["Lab report", "Reading", "Quiz prep"].map((t, i) => ({id: "t" + i, courseId: "c1", title: t, due: "2026-10-29", type: "assignment", status: "todo"})), notes: []};
    await ctx.addInitScript(s => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.clock.install({time: new Date("2026-10-28T09:00:00-07:00")});   // a Wednesday
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(800);
    await page.evaluate(() => { window.__sbSync.ui.tab = "schedule"; window.__sbSync.ui.schDay = 2; window.__sbSync.render(); }); await page.waitForSelector(".sch-col.sel"); await page.waitForTimeout(300);
    // a finger swipe made of real touch events
    const swipe = (from, to, steps, opts = {}) => page.evaluate(async ([from, to, steps, opts]) => {
      const col = document.querySelector(".sch-col.sel"), r = col.getBoundingClientRect(), y = r.top + 80;
      const T = x => new Touch({identifier: 1, target: col, clientX: x, clientY: y, pageX: x, pageY: y + scrollY});
      const fire = (type, x) => col.dispatchEvent(new TouchEvent(type, {touches: type === "touchend" ? [] : [T(x)], changedTouches: [T(x)], bubbles: true, cancelable: true}));
      const g = document.querySelector(".sch-gutter"), top0 = Math.round(col.getBoundingClientRect().top), gb0 = getComputedStyle(g).backgroundColor;
      fire("touchstart", from); let mid = null;
      for (let i = 1; i <= steps; i++) { await new Promise(r => setTimeout(r, 16)); fire("touchmove", from + (to - from) * i / steps);
        if (i === Math.round(steps * 0.7)) { const p = document.querySelector(".sch-col.sch-peek"), s = document.querySelector(".sch-col.sel"); mid = {peek: p ? Math.round(p.getBoundingClientRect().left) : null, cur: Math.round(s.getBoundingClientRect().left), date: p ? p.dataset.date : null, topMoved: Math.round(s.getBoundingClientRect().top) - top0, gutterSame: getComputedStyle(g).backgroundColor === gb0, clipped: getComputedStyle(s).clipPath !== "none"}; } }
      if (opts.hold) await new Promise(r => setTimeout(r, 200));
      fire("touchend", to); return mid;
    }, [from, to, steps, opts]);
    const day = () => page.evaluate(() => ({sel: window.__sbSync.ui.schDay, week: window.__sbSync.ui.schWeek || null, date: document.querySelector(".sch-col.sel").dataset.date}));
    const d0 = await day();
    const mid = await swipe(320, 120, 12, {hold: true});
    ok(mid && mid.peek !== null && mid.cur < 40 && mid.peek > mid.cur && mid.peek < 402, "mid-swipe: the day moves with the finger and the next day is sliding in beside it: " + JSON.stringify(mid));
    ok(mid.topMoved === 0, "the day being swiped away doesn't jump, even though the next day has more due items in its header (" + mid.topMoved + "px)");
    ok(mid.gutterSame && mid.clipped, "the hours keep their look; the sliding days are trimmed at the edge instead of passing under them");
    await page.waitForTimeout(500);
    const d1 = await day();
    ok(d1.date === mid.date && d1.date > d0.date, "let go past a third: it settles on the next day (" + d0.date + " -> " + d1.date + ")");
    ok(await page.evaluate(() => !document.querySelector(".sch-peek, .sch-swiping")), "and nothing is left mid-slide");
    await swipe(300, 250, 6, {hold: true}); await page.waitForTimeout(500);
    ok((await day()).date === d1.date, "a short, slow swipe springs back to the same day");
    await swipe(120, 320, 12, {hold: true}); await page.waitForTimeout(500);
    ok((await day()).date === d0.date, "swiping the other way goes back a day");
    // past the end of the week
    await page.evaluate(() => { window.__sbSync.ui.schDay = -1; window.__sbSync.render(); }); await page.waitForTimeout(300);
    const last = await day(), m2 = await swipe(320, 120, 12, {hold: true}); await page.waitForTimeout(500);
    const nx = await day();
    ok(m2 && m2.date && m2.date > last.date && nx.date === m2.date, "past the end of the week, the next week's first day slides in and stays: " + last.date + " -> " + nx.date);
    ok(await page.evaluate(() => document.querySelectorAll(".sch-grid > .sch-col").length) >= 5, "the new week is drawn whole");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log("\nsch-swipe.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
