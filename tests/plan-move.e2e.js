// node tests/plan-move.e2e.js  Today's Plan time strip: drag a study block to another time (mouse, 1300 px), Move To… (phone, 402 px),
// snapping out of a class, the pin, Undo, Tomorrow and Let Studyboard Pick. The clock is fixed at 9:00 AM on a Tuesday.
// PLAN_MOVE_SHOTS=<dir> also saves screenshots.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SHOTS = process.env.PLAN_MOVE_SHOTS || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 10, 24, 9, 0), DAY = "2026-11-24", NEXT = "2026-11-25";
function seed(){
  window.__SB_TEST = true;
  const p = n => String(n).padStart(2, "0"), iso = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const D = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); }, now = Date.now();
  const T = (id, title, c, type, due, o) => Object.assign({id, title, courseId: c, type, start: D(-3), due, time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: now, order: 10}, o || {});
  if (localStorage.getItem("pm-seeded")) return; localStorage.setItem("pm-seeded", "1");
  localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1,
    courses: [
      {id: "bio", name: "Anatomy & Physiology", code: "BIOL 1200", color: "#1E9E74", meetings: [{id: "m1", kind: "Lecture", days: [1, 3], start: "09:30", end: "11:20", where: "SW1 2015"}]},
      {id: "psy", name: "Intro to Psychology", code: "PSYC 1010", color: "#3B6FE0", meetings: [{id: "m3", kind: "Lecture", days: [2, 4], start: "11:30", end: "12:50", where: "Hall C"}]},
      {id: "eng", name: "Academic Writing", code: "ENGL 1100", color: "#D9661F", meetings: [{id: "m4", kind: "Seminar", days: [5], start: "10:00", end: "11:50", where: "Room 214"}]}],
    tasks: [
      T("t1", "Research Essay Draft", "eng", "Assignment", D(2), {time: "23:59", weight: 20, pct: 40, status: "doing", hours: 4}),
      T("t2", "Midterm Exam", "bio", "Exam", D(5), {time: "09:30", weight: 30, hours: 6, location: "SW1 1020"}),
      T("t3", "Chapter 6 Quiz", "psy", "Quiz", D(1), {time: "23:00", weight: 5, hours: 1}),
      T("t5", "Read Chapter 7", "psy", "Reading", D(3), {hours: 1})],
    events: [], notes: [], decks: [], files: [], settings: {}}));
  localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (w, h, mob) => {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1});
    await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.clock.setFixedTime(NOW);
    await page.addInitScript(seed);
    await page.goto(base); await page.waitForSelector('.dtl .pm-card[data-mv="t5"]', {timeout: 40000}); await page.waitForTimeout(600);
    return {ctx, page, errs};
  };
  // the strip as text, card by card
  const strip = page => page.evaluate(() => [...document.querySelectorAll(".dtl-rail > .dtl-c")].map(c => c.innerText.replace(/\s+/g, " ").trim()));
  const card = (page, id) => page.evaluate(id => { const c = document.querySelector(`.pm-card[data-mv="${id}"]`); return c ? {s: +c.dataset.s, e: +c.dataset.e, pinned: c.classList.contains("pinned"), text: c.innerText.replace(/\s+/g, " ").trim()} : null; }, id);
  const pins = (page, id) => page.evaluate(id => JSON.parse(localStorage.getItem("coursework:v2")).tasks.find(t => t.id === id).pins || null, id);
  const toastText = page => page.evaluate(() => { const t = document.getElementById("toastMsg"); return t ? t.textContent : ""; });
  const shot = async (page, name, clip) => { if (SHOTS) await page.screenshot({path: path.join(SHOTS, `timeline-${name}.png`), clip}); };
  // Drag a block with the mouse so its start lands at minute `to` (worked out from where the cards are, like the app does)
  async function drag(page, id, to, mid){
    await page.locator(`.pm-card[data-mv="${id}"]`).scrollIntoViewIfNeeded();
    const g = await page.evaluate(([id, to]) => {
      const rail = document.querySelector(".dtl-rail"), rr = rail.getBoundingClientRect(), c = document.querySelector(`.pm-card[data-mv="${id}"]`), cr = c.getBoundingClientRect();
      const L = [...rail.querySelectorAll(".dtl-c[data-s]")].map(el => { const r = el.getBoundingClientRect(); return {l: r.left, w: r.width, s: +el.dataset.s, e: +el.dataset.e}; }).sort((a, b) => a.l - b.l);
      const it = L.find(x => to < x.e) || L[L.length - 1], tx = it.l + Math.max(0, to - it.s) / (it.e - it.s) * it.w;
      return {x: cr.left + 30, y: cr.top + cr.height / 2, dx: tx - cr.left, rl: rr.left, rr: rr.right};
    }, [id, to]);
    await page.mouse.move(g.x, g.y); await page.mouse.down();
    const steps = 12;
    for (let i = 1; i <= steps; i++) { await page.mouse.move(g.x + g.dx * i / steps, g.y + (i % 2)); await page.waitForTimeout(16); }
    if (mid) await mid();
    await page.mouse.up(); await page.waitForTimeout(500);
  }
  try {
    // ---- desktop: mouse drag
    {
      const {ctx, page, errs} = await open(1300, 860, false);
      const before = await card(page, "t5");
      ok(before && before.s === 650 && !before.pinned, "Read Chapter 7 starts at 10:50 AM, not pinned: " + JSON.stringify(before));
      ok(await page.locator(".pm-card .dtl-mv").count() >= 3, "each study block to come has a Move button");
      // 1. dropped on the psychology lecture (11:30 AM to 12:50 PM): it snaps to the nearest free time and says why
      await drag(page, "t5", 720, async () => {
        const ind = await page.evaluate(() => { const i = document.querySelector(".pm-ind"); return i ? {text: i.innerText, snap: i.classList.contains("snap")} : null; });
        ok(ind && ind.snap && /12:50.1:20 PM/.test(ind.text) && /PSYC 1010 is fixed/.test(ind.text), "mid-drag over the class, the drop line says where it will land: " + JSON.stringify(ind));
        ok(await page.evaluate(() => document.querySelector(".pm-card.pm-drag") !== null), "the block lifts while it's dragged");
        await shot(page, "drag-desktop", {x: 220, y: 200, width: 980, height: 190});
      });
      let c = await card(page, "t5");
      ok(c && c.s === 770 && c.e === 800 && c.pinned, "it landed right after the class, 12:50 to 1:20 PM, pinned: " + JSON.stringify(c));
      ok(/PSYC 1010 is fixed, so Read Chapter 7 moved to the nearest free time, 12:50.1:20 PM/.test(await toastText(page)), "one line says why: " + await toastText(page));
      ok(JSON.stringify(await pins(page, "t5")) === JSON.stringify([{date: DAY, s: 770, e: 800}]), "the pin is saved on the task for today");
      await page.waitForTimeout(150);
      await shot(page, "snap-desktop", {x: 136, y: 180, width: 1164, height: 680});
      const sl = await page.evaluate(() => window.__sbPlanMove.slots());
      ok(sl.t5 && sl.t5.length === 1 && sl.t5[0].s === 770 && sl.t5[0].pin, "the plan's slots (Do This Next, widgets) have it at the pinned time");
      const others = Object.entries(sl).filter(([k]) => k !== "t5").flatMap(([, l]) => l);
      ok(others.every(o => o.e <= 770 || o.s >= 800), "nothing else is planned on top of the pinned block: " + JSON.stringify(others));
      const w = await page.evaluate(() => window.__sbPhoneWidgets.data().plan.find(x => x.id === "t5"));
      ok(w && new Date(w.from).getHours() === 12 && new Date(w.from).getMinutes() === 50, "the widget feed has the moved time too");
      // 2. Undo puts it back
      await page.click("#toastUndo"); await page.waitForTimeout(500);
      c = await card(page, "t5");
      ok(c && c.s === 650 && !c.pinned && (await pins(page, "t5")) === null, "Undo puts it back where the planner had it: " + JSON.stringify(c));
      // 3. a plain move onto another (unpinned) study block: it goes exactly there, and the other one moves around it
      await drag(page, "t5", 600);
      c = await card(page, "t5");
      ok(c && c.s === 600 && c.e === 630 && c.pinned, "dropped at 10:00 AM (on another study block), it stays at 10:00 AM: " + JSON.stringify(c));
      ok(/^Moved Read Chapter 7 to 10:00.10:30 AM/.test(await toastText(page)), "says where it went: " + await toastText(page));
      await shot(page, "pinned-desktop", {x: 220, y: 240, width: 980, height: 130});
      // 4. Let Studyboard Pick (from its menu) removes the pin
      await page.click('.pm-card[data-mv="t5"] .dtl-mv'); await page.waitForSelector(".pm-menu");
      ok(await page.locator('.pm-menu [role="menuitem"]', {hasText: "Let Studyboard Pick"}).count() === 1, "a pinned block's menu offers Let Studyboard Pick");
      await page.locator('.pm-menu [role="menuitem"]', {hasText: "Let Studyboard Pick"}).click(); await page.waitForTimeout(500);
      c = await card(page, "t5");
      ok(c && c.s === 650 && !c.pinned && (await pins(page, "t5")) === null, "Let Studyboard Pick: the pin goes and the planner places it again: " + JSON.stringify(c));
      // 5. a click (no drag) still opens the task
      await page.locator('.pm-card[data-mv="t5"] .dtl-open').click(); await page.waitForTimeout(500);
      ok(await page.evaluate(() => !!document.querySelector("dialog[open]")), "clicking a block still opens the task");
      ok(!errs.length, "desktop: no page errors: " + errs.join(" | "));
      await ctx.close();
    }
    // ---- phone: Move To…
    {
      const {ctx, page, errs} = await open(402, 874, true);
      // touch: long-press a block, then drag it onto the class; it snaps to the nearest free time (just before the class)
      {
        const cdp = await ctx.newCDPSession(page);
        await page.waitForTimeout(1200); await page.evaluate(() => { const c = document.querySelector('.pm-card[data-mv="t5"]'), r = c.closest(".dtl-rail"); c.scrollIntoView({block: "center"}); r.scrollLeft += c.getBoundingClientRect().left - r.getBoundingClientRect().left - 8; }); await page.waitForTimeout(150);
        const g = await page.evaluate(() => { const c = document.querySelector('.pm-card[data-mv="t5"]').getBoundingClientRect(), k = [...document.querySelectorAll(".dtl-rail > .dtl-c.ev")].find(x => /PSYC/.test(x.textContent)).getBoundingClientRect(); return {x: c.left + 20, y: c.top + c.height - 14, tx: c.left + 20 + (k.left + 24 - c.left)}; });
        const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", {type, touchPoints: type === "touchEnd" ? [] : [{x, y}]});
        await touch("touchStart", g.x, g.y); await page.waitForTimeout(650);
        ok(await page.evaluate(() => !!document.querySelector(".pm-card.pm-drag")), "touch: after a long-press the block lifts");
        for (let i = 1; i <= 10; i++) { await touch("touchMove", g.x + (g.tx - g.x) * i / 10, g.y); await page.waitForTimeout(20); }
        const ind = await page.evaluate(() => { const i = document.querySelector(".pm-ind"); return i ? i.innerText : ""; });
        ok(/11:00.11:30 AM · PSYC 1010 is fixed/.test(ind), "touch: dragged onto the start of the class, the drop line shows it will snap to just before it: " + ind);
        await shot(page, "drag-phone", {x: 0, y: 220, width: 402, height: 200});
        await touch("touchEnd"); await page.waitForTimeout(600);
        const c = await card(page, "t5");
        ok(c && c.s === 660 && c.pinned, "touch: dropped, it is pinned at 11:00 AM, the nearest free time: " + JSON.stringify(c));
        ok(/PSYC 1010 is fixed/.test(await toastText(page)), "touch: and says why");
        ok(await page.evaluate(() => !document.querySelector("dialog[open]")), "touch: letting go doesn't open the task");
        await page.locator('.pm-card[data-mv="t5"]').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
        await shot(page, "snap-phone");
        await page.locator("#toastUndo").tap(); await page.waitForTimeout(500);
        ok((await pins(page, "t5")) === null, "touch: Undo");
        // a quick swipe on a block still scrolls the strip, and doesn't pick it up
        await touch("touchStart", g.x, g.y); await touch("touchMove", g.x - 60, g.y); await page.waitForTimeout(500);
        ok(await page.evaluate(() => !document.querySelector(".pm-card.pm-drag")), "touch: a quick swipe doesn't pick a block up");
        await touch("touchEnd"); await page.waitForTimeout(300);
      }
      await page.locator('.pm-card[data-mv="t5"] .dtl-mv').scrollIntoViewIfNeeded();
      await page.locator('.pm-card[data-mv="t5"] .dtl-mv').tap(); await page.waitForSelector(".pm-menu");
      const m = await page.evaluate(() => { const el = document.querySelector(".pm-menu"), r = el.getBoundingClientRect(); return {items: [...el.querySelectorAll('[role="menuitem"]')].map(b => b.textContent), focus: document.activeElement && document.activeElement.textContent, l: r.left, r: r.right, b: r.bottom, h: Math.min(...[...el.querySelectorAll('[role="menuitem"]')].map(b => b.getBoundingClientRect().height))}; });
      ok(m.items.length >= 3 && m.items.includes("Tomorrow") && !m.items.includes("Let Studyboard Pick") && /AM|PM/.test(m.items[0]), "Move To… lists times that fit, then Tomorrow: " + JSON.stringify(m.items));
      ok(!m.items.some(t => /11:30|12:00/.test(t.split("–")[0])), "no time inside the class is offered");
      ok(m.l >= 0 && m.r <= 402 && m.b <= 874 && m.h >= 43.5, "the menu is on screen, with 44px rows: " + JSON.stringify(m));
      ok(m.focus === m.items[0], "focus goes to the first item");
      await page.waitForTimeout(400); await shot(page, "menu-phone");
      const pick = m.items.find(t => /^12:50/.test(t)) || m.items[1];
      await page.locator('.pm-menu [role="menuitem"]', {hasText: pick}).tap(); await page.waitForTimeout(500);
      let c = await card(page, "t5");
      ok(c && c.pinned && /^12:50/.test(pick) ? c.s === 770 : c.pinned, `picked ${pick}: it moved there and is pinned: ` + JSON.stringify(c));
      ok(/^Moved Read Chapter 7 to /.test(await toastText(page)), "says where it went");
      await page.locator('.pm-card[data-mv="t5"]').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
      await shot(page, "pinned-phone");
      await page.locator("#toastUndo").tap(); await page.waitForTimeout(500);
      c = await card(page, "t5");
      ok(c && c.s === 650 && !c.pinned && (await pins(page, "t5")) === null, "Undo puts it back: " + JSON.stringify(c));
      // Tomorrow: nothing for it today, and a pinned block in tomorrow's first free time
      await page.locator('.pm-card[data-mv="t5"] .dtl-mv').tap(); await page.waitForSelector(".pm-menu");
      await page.locator('.pm-menu [role="menuitem"]', {hasText: "Tomorrow"}).tap(); await page.waitForTimeout(500);
      const p = await pins(page, "t5");
      ok(!(await card(page, "t5")), "Tomorrow: it's off today's strip");
      ok(p && p.some(x => x.date === DAY && x.s === 0 && x.e === 0) && p.some(x => x.date === NEXT && x.e - x.s === 30), "and pinned for tomorrow: " + JSON.stringify(p));
      ok(/^Moved Read Chapter 7 to tomorrow/.test(await toastText(page)), "says so: " + await toastText(page));
      await page.locator("#toastUndo").tap(); await page.waitForTimeout(500);
      ok((await card(page, "t5")) && (await pins(page, "t5")) === null, "Undo brings it back to today");
      // keyboard: Enter opens the menu, arrows move, Enter picks; Escape closes and focus returns
      await page.locator('.pm-card[data-mv="t5"] .dtl-mv').focus(); await page.keyboard.press("Enter"); await page.waitForSelector(".pm-menu");
      await page.keyboard.press("Escape"); await page.waitForTimeout(100);
      ok(await page.evaluate(() => !document.querySelector(".pm-menu") && document.activeElement && document.activeElement.dataset.pm === "t5"), "Escape closes the menu and focus goes back to its button");
      await page.keyboard.press("Enter"); await page.waitForSelector(".pm-menu"); await page.keyboard.press("ArrowDown"); const kb = await page.evaluate(() => document.activeElement.textContent); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
      c = await card(page, "t5");
      ok(c && c.pinned && c.text.includes(kb.replace(/\s/g, " ").split("–")[0].replace(/ ?[AP]M$/, "")), `keyboard: ArrowDown and Enter moved it to ${kb}: ` + JSON.stringify(c));
      ok(await page.evaluate(() => document.activeElement && document.activeElement.dataset.pm === "t5"), "focus comes back to the moved block's menu button");
      ok(!errs.length, "phone: no page errors: " + errs.join(" | "));
      await ctx.close();
    }
    // ---- a pin only counts on its own day
    {
      const {ctx, page, errs} = await open(1300, 860, false);
      await page.evaluate(() => window.__sbPlanMove.moveTo("t5", 650, 680, 900, 930, "Moved"));
      await page.waitForTimeout(400);
      ok((await card(page, "t5")).s === 900, "pinned at 3:00 PM today");
      await page.clock.setFixedTime(new Date(2026, 10, 25, 9, 0)); await page.reload(); await page.waitForSelector(".dtl .pm-card", {timeout: 40000}); await page.waitForTimeout(600);
      const c = await card(page, "t5");
      ok(!c || (!c.pinned && c.s !== 900), "the next day, yesterday's pin is ignored: " + JSON.stringify(c));
      ok(!errs.length, "no page errors: " + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nplan-move.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
