// node tests/board-motion.e2e.js: Task Board cards move smoothly. While dragging, the cards around the gap slide out of the
// way; on drop, the card glides from where it was let go into its new place (and the column it left closes up smoothly),
// instead of everything snapping at once. Set REC=dir to also record a video.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; console.log((c ? "ok - " : "FAIL: ") + m); if (!c) process.exitCode = 1; };
const T = (id, title, due, status, order) => ({id, title, courseId: "c1", type: "Assignment", start: "2026-10-01", due, time: "", priority: "med", status, notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order, doneAt: null});
const TASKS = [T("t1", "Lab Report", "2026-10-08", "todo", 10), T("t2", "Reading Ch. 4", "2026-10-09", "todo", 20), T("t3", "Essay Draft", "2026-10-12", "todo", 30), T("t4", "Problem Set 3", "2026-10-14", "todo", 40),
  T("g1", "Study Guide", "2026-10-10", "doing", 10), T("g2", "Flashcards", "2026-10-11", "doing", 20), T("d1", "Workshop Quiz", "2026-10-07", "done", 10)];
const seed = tasks => { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("coursework:group", "none");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Biology 101", code: "BIO101", color: "#4F8A5B"}], tasks, files: [], notes: [], decks: [], events: [], settings: {capacity: 15, dailyHours: 4}, updated: 1})); };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    const rec = process.env.REC;
    const ctx = await browser.newContext(Object.assign({viewport: {width: 1100, height: 720}, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block"}, rec ? {recordVideo: {dir: rec, size: {width: 1100, height: 720}}} : {}));
    const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.clock.install({time: new Date("2026-10-06T15:00:00-04:00")});
    await p.addInitScript(seed, TASKS);
    await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
    await p.waitForFunction(() => window.__sbAvail && document.readyState === "complete", null, {timeout: 20000});
    await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "board"}));
    await p.waitForSelector('.col[data-status="doing"] .card'); await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelector(".board").scrollIntoView({block: "start"})); await p.waitForTimeout(300);
    const box = async id => p.locator(`.board .card[data-id="${id}"]:not(.ghost)`).boundingBox();
    const a = await box("t2"), tgt = await box("g2");
    // pick up "Reading Ch. 4" and carry it to Doing, between the two cards there
    await p.mouse.move(a.x + 30, a.y + 14); await p.mouse.down();
    const steps = 24, ex = tgt.x + 30, ey = tgt.y + 6;
    let slid = false;
    for (let i = 1; i <= steps; i++) {
      await p.mouse.move(a.x + 30 + (ex - a.x - 30) * i / steps, a.y + 14 + (ey - a.y - 14) * i / steps); await p.waitForTimeout(rec ? 45 : 25);
      if (!slid) slid = await p.evaluate(() => [...document.querySelectorAll(".board .card[data-id]:not(.ghost)")].some(c => c.getAnimations().some(x => x.id === "bf" && x.playState === "running")));
    }
    ok(slid, "while dragging, the cards around the gap slide out of the way");
    const g2Moving = await p.evaluate(() => { const c = document.querySelector('.col[data-status="doing"] .card[data-id="g2"]'); return c.getAnimations().length > 0 || true; });
    await p.waitForTimeout(400);
    const ghost = await p.evaluate(() => { const g = document.querySelector(".ghost"); const r = g.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
    await p.mouse.up();
    // right after letting go the card is still near the finger and on its way
    const t0 = await p.evaluate(() => new Promise(res => { const t = performance.now(), look = () => { const c = document.querySelector('.col[data-status="doing"] .card[data-id="t2"]'), r = c && c.getBoundingClientRect(); if (c) res({x: r.left + r.width / 2, y: r.top + r.height / 2, anim: c.getAnimations().some(x => x.id === "bf"), ghosts: document.querySelectorAll(".ghost").length}); else if (performance.now() - t > 500) res(null); else requestAnimationFrame(look); }; requestAnimationFrame(look); }));
    await p.waitForTimeout(700);
    const t1 = await p.evaluate(() => { const c = document.querySelector('.col[data-status="doing"] .card[data-id="t2"]'), r = c.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2, anim: c.getAnimations().length}; });
    ok(t0 && t0.anim, "on drop, the card is animating into its new place: " + JSON.stringify(t0));
    ok(t0 && Math.hypot(t0.x - ghost.x, t0.y - ghost.y) < Math.hypot(t1.x - ghost.x, t1.y - ghost.y) + 1 && Math.hypot(t0.x - ghost.x, t0.y - ghost.y) < 30, "it starts where it was let go (" + JSON.stringify([ghost, t0, t1]) + ")");
    ok(t0 && t0.ghosts === 0, "the floating copy is gone the moment the real card takes over");
    ok(t1.anim === 0, "and it settles, with nothing left animating");
    const doing = await p.evaluate(() => [...document.querySelectorAll('.col[data-status="doing"] .card[data-id]:not(.ghost)')].map(c => c.dataset.id));
    ok(doing.includes("t2") && doing.length === 3, "it lands in Doing: " + doing.join(","));
    ok(!errs.length, "no page errors " + errs.join(" | "));
    await ctx.close();

    // Phone: the columns are a swipe pager. Dropping while the board is half way between two columns glides it over to the
    // card's column instead of snapping there.
    const pctx = await browser.newContext(Object.assign({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block"}, rec ? {recordVideo: {dir: rec + "/phone", size: {width: 402, height: 874}}} : {}));
    const q = await pctx.newPage(), perrs = []; q.on("pageerror", e => perrs.push(e.message));
    await q.clock.install({time: new Date("2026-10-06T15:00:00-04:00")});
    await q.addInitScript(seed, TASKS);
    await q.goto("http://127.0.0.1:" + server.address().port + "/index.html");
    await q.waitForFunction(() => window.__sbAvail && document.readyState === "complete", null, {timeout: 20000});
    await q.evaluate(() => window.__sbAvail.view({tab: "board", bview: "board"}));
    await q.waitForSelector('.col[data-status="doing"] .card'); await q.waitForTimeout(600);
    await q.evaluate(() => document.querySelector(".board").scrollIntoView({block: "start"})); await q.waitForTimeout(300);
    const pb = await q.locator('.board .card[data-id="t1"]').boundingBox();
    await q.mouse.move(pb.x + 40, pb.y + 14); await q.mouse.down();
    for (let i = 1; i <= 6; i++) { await q.mouse.move(pb.x + 40 + i * 8, pb.y + 14 + i * 4); await q.waitForTimeout(30); }
    // carry it over: the board is part way to In Progress when the finger lifts
    const mid = await q.evaluate(() => { const b = document.querySelector(".board"), d = document.querySelector('.col[data-status="doing"]'); const full = b.scrollLeft + d.getBoundingClientRect().left - b.getBoundingClientRect().left - 18; b.scrollLeft = Math.round(full * 0.62); return {at: b.scrollLeft, full: Math.round(full)}; });
    await q.waitForTimeout(rec ? 500 : 120);
    await q.mouse.move(330, pb.y + 40); await q.waitForTimeout(rec ? 400 : 120);
    await q.evaluate(() => { window.__pan = []; const t0 = performance.now(), look = () => { const b = document.querySelector(".board"); window.__pan.push([Math.round(performance.now() - t0), Math.round(b.scrollLeft)]); if (performance.now() - t0 < 900) requestAnimationFrame(look); }; requestAnimationFrame(look); });
    await q.mouse.up(); await q.waitForTimeout(1100);
    const pan = await q.evaluate(() => window.__pan), xs = pan.map(x => x[1]), end = xs[xs.length - 1];
    const between = new Set(xs.filter(x => x > mid.at + 3 && x < end - 3)).size, jump = Math.max(...xs.slice(1).map((x, i) => Math.abs(x - xs[i])));
    const pdoing = await q.evaluate(() => [...document.querySelectorAll('.col[data-status="doing"] .card[data-id]:not(.ghost)')].map(c => c.dataset.id));
    ok(pdoing.includes("t1"), "phone: the card was dropped into In Progress: " + pdoing.join(","));
    ok(Math.abs(end - mid.full) <= 2, "phone: the board ends lined up on In Progress (" + end + " vs " + mid.full + ")");
    ok(between >= 3 && jump < (mid.full - mid.at) * 0.6, "phone: it glides there from half way instead of snapping (" + between + " in-between frames, biggest step " + jump + "px of " + (mid.full - mid.at) + "): " + xs.slice(0, 14).join(" "));
    ok(await q.evaluate(() => !document.querySelector(".board.panning, .board.dragging") && getComputedStyle(document.querySelector(".board")).scrollSnapType.startsWith("x")), "phone: swipe snapping is back on afterwards");
    // holding a dragged card at the right edge glides the board one whole column over (not a jump, not a creep)
    await q.waitForTimeout(800);
    await q.evaluate(() => { const b = document.querySelector(".board"); b.scrollLeft = 0; }); await q.waitForTimeout(300);
    const pc = await q.locator('.board .card[data-id="t2"]').boundingBox();
    await q.mouse.move(pc.x + 40, pc.y + 14); await q.mouse.down();
    for (let i = 1; i <= 6; i++) { await q.mouse.move(pc.x + 40 + i * 8, pc.y + 14 + i * 3); await q.waitForTimeout(30); }
    await q.evaluate(() => { window.__pe = []; const b = document.querySelector(".board"), t0 = performance.now(), look = () => { window.__pe.push(Math.round(b.scrollLeft)); if (performance.now() - t0 < 900) requestAnimationFrame(look); }; requestAnimationFrame(look); });
    await q.mouse.move(398, pc.y + 60); await q.waitForTimeout(950);
    const pe = await q.evaluate(() => window.__pe), cols = await q.evaluate(() => { const b = document.querySelector(".board"); return [...b.querySelectorAll(".col")].map(c => Math.round(b.scrollLeft + c.getBoundingClientRect().left - b.getBoundingClientRect().left - 18)); });
    const peEnd = pe[pe.length - 1], mids = new Set(pe.filter(x => x > 2 && x < peEnd - 2)).size;
    ok(peEnd > 100 && cols.some(c => Math.abs(c - peEnd) <= 3), "phone: holding a card at the edge brings the next column fully into place: " + peEnd + " (columns at " + cols.join(", ") + ")");
    ok(mids >= 4, "phone: and it glides there (" + mids + " in-between frames): " + pe.filter((x, i) => i % 3 === 0).join(" "));
    await q.mouse.up(); await q.waitForTimeout(900);
    // from Complete back to In Progress: hovering the card over the bit of In Progress peeking in on the left brings it over
    await q.evaluate(() => { const b = document.querySelector(".board"), c = document.querySelector('.col[data-status="done"]'); b.scrollLeft = b.scrollLeft + c.getBoundingClientRect().left - b.getBoundingClientRect().left - 18; }); await q.waitForTimeout(500);
    const dc = await q.locator('.board .card[data-id="d1"]').boundingBox();
    const ipX = await q.evaluate(() => { const b = document.querySelector(".board"), c = document.querySelector('.col[data-status="doing"]'); return Math.round(b.scrollLeft + c.getBoundingClientRect().left - b.getBoundingClientRect().left - 18); });
    const peekR = await q.evaluate(() => Math.round(document.querySelector('.col[data-status="doing"]').getBoundingClientRect().right));
    await q.mouse.move(dc.x + 120, dc.y + 14); await q.mouse.down();
    for (let i = 1; i <= 10; i++) { await q.mouse.move(dc.x + 120 - i * ((dc.x + 120 - (peekR - 20)) / 10), dc.y + 14 + i * 3); await q.waitForTimeout(30); }
    await q.waitForTimeout(1000);
    const nowX = await q.evaluate(() => Math.round(document.querySelector(".board").scrollLeft));
    ok(Math.abs(nowX - ipX) <= 3, "phone: a card hovered over In Progress peeking in from the left brings In Progress into view (" + nowX + " vs " + ipX + "; finger at " + (peekR - 20) + "px)");
    await q.mouse.up(); await q.waitForTimeout(900);
    ok(await q.evaluate(() => [...document.querySelectorAll('.col[data-status="doing"] .card[data-id]:not(.ghost)')].some(c => c.dataset.id === "d1")), "phone: and it drops into In Progress");
    ok(!perrs.length, "phone: no page errors " + perrs.join(" | "));
    await pctx.close();
    console.log("\nboard-motion.e2e: " + checks + " checks " + (process.exitCode ? "FAILED" : "passed"));
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
