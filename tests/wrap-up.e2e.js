// node tests/wrap-up.e2e.js  Wrap Up Today: the quiet row at the bottom of Today's Plan in the last hour of the study day, its sheet
// (what got done, Tomorrow / Pick a Day / Let It Go, tomorrow's first task, the "on my mind" note), one Undo (the toast's and Ctrl+Z),
// the chosen task as Do This Next the next morning, and the setting. Phone (402 px, Essentials on) and desktop (1300 px).
// The clock is fixed on Tuesday 24 November 2026. WRAP_SHOTS=<dir> also saves screenshots (WRAP_THEME=dark for the dark theme).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SHOTS = process.env.WRAP_SHOTS || "", DARK = process.env.WRAP_THEME === "dark";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const DAY = "2026-11-24", NEXT = "2026-11-25", LATER = "2026-11-27";
const at = (d, h, m) => new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), h, m || 0);
function seed(ess){
  window.__SB_TEST = true;
  if (localStorage.getItem("wu-seeded")) return; localStorage.setItem("wu-seeded", "1");
  const p = n => String(n).padStart(2, "0"), iso = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const D = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); }, now = Date.now();
  const T = (id, title, c, type, due, o) => Object.assign({id, title, courseId: c, type, start: D(-3), due, time: "23:59", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: now - 36e5, order: 10}, o || {});
  localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1,
    courses: [
      {id: "bio", name: "Anatomy & Physiology", code: "BIOL 1200", color: "#1E9E74"},
      {id: "psy", name: "Intro to Psychology", code: "PSYC 1010", color: "#3B6FE0"},
      {id: "eng", name: "Academic Writing", code: "ENGL 1100", color: "#D9661F"}],
    tasks: [
      T("t1", "Research Essay Draft", "eng", "Assignment", D(4), {weight: 20, hours: 5}),
      T("t2", "Lab Report 4", "bio", "Assignment", D(2), {weight: 10, hours: 3}),
      T("t3", "Read Chapter 7", "psy", "Reading", D(3), {hours: 1.5}),
      T("t4", "Problem Set 6", "psy", "Assignment", D(0), {status: "done", pct: 100, doneAt: now - 2 * 36e5, hours: 1}),
      T("t5", "Discussion Post", "psy", "Assignment", D(8), {hours: 0.5})],
    events: [], notes: [], decks: [], files: [], settings: {dailyHours: 4, focusDays: {[D(0)]: 50}}}));
  localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
  if (ess) localStorage.setItem("sb:ess", JSON.stringify({on: true, why: "new", at: now, unl: {}, said: {}}));
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
  const task = async (page, id) => (await store(page)).tasks.find(t => t.id === id);
  const toastText = page => page.evaluate(() => { const t = document.getElementById("toastMsg"); return t ? t.textContent : ""; });
  try {
    for (const [W, H, mob, ess] of [[402, 874, true, true], [1300, 860, false, false]]) {
      const tag = mob ? "phone" : "desktop";
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: W, height: H}, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, colorScheme: DARK ? "dark" : "light"});
      await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.clock.setFixedTime(at(DAY, 14, 0));
      await page.addInitScript(seed, ess);
      const load = async (when) => { if (when) await page.clock.setFixedTime(when); await page.goto(base); await page.waitForSelector("section.plan .next-up", {timeout: 40000}); await page.waitForTimeout(500); };
      const shot = async (name, sel, pad = 60) => {
        if (!SHOTS) return;
        const f = path.join(SHOTS, `${tag}-${DARK ? "dark" : "light"}-${name}.png`);
        if (sel) { const el = page.locator(sel).first(); await el.evaluate(e => e.scrollIntoView({block: "center"})); await page.waitForTimeout(150); const b = await el.boundingBox(); const y = Math.max(0, b.y - pad); await page.screenshot({path: f, clip: {x: 0, y, width: W, height: Math.min(H - y, b.height + pad + 60)}}); }
        else await page.screenshot({path: f});
      };
      const wrapUp = async () => { await page.click("button.wu-row"); await page.waitForSelector("#dlg .wu-body .wu-sec"); await page.waitForTimeout(250); };
      const move = (title, k) => page.locator("#dlg .wu-it", {hasText: title}).locator(`.wu-mv[data-k="${k}"]`).click();

      // 1. Early afternoon with work still planned: no row
      await load();
      if (ess) ok(await page.evaluate(() => SBESS.on()), `${tag}: Essentials is on`);
      ok(await page.locator(".wu-row").count() === 0, `${tag}: at 2 PM, with work still planned, there's no wrap-up row`);

      // 2. The last hour of the study day (7 AM to 11 PM): one quiet row at the bottom of Today's Plan
      await load(at(DAY, 22, 15));
      const row = page.locator("section.plan button.wu-row");
      ok(await row.count() === 1 && /Wrap up today/.test(await row.innerText()), `${tag}: at 10:15 PM the row "Wrap up today" shows`);
      ok(await page.evaluate(() => { const r = document.querySelector("button.wu-row"), f = document.querySelector("section.plan .plan-foot"); return !!f && !!(r.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) && !r.classList.contains("primary"); }), `${tag}: it sits just above the plan's footer and isn't a primary button`);
      ok(await page.evaluate(() => !document.querySelector("#dlg[open]")), `${tag}: no popup opened by itself`);
      await shot("row", "section.plan button.wu-row");

      // 3. The sheet
      await wrapUp();
      const sheet = await page.locator("#dlg .wu-body").innerText();
      ok(/Wrap Up Today/.test(await page.textContent("#dlg .sheet-head")), `${tag}: the sheet opens`);
      await shot("sheet");
      ok(/1\s*task finished/.test(sheet) && /50m\s*of focus/.test(sheet) && /Problem Set 6/.test(sheet), `${tag}: what got done: 1 task finished and 50m of focus`);
      const open = await page.$$eval("#dlg .wu-open .wu-li b", l => l.map(b => b.textContent));
      ok(["Lab Report 4", "Research Essay Draft", "Read Chapter 7"].every(t => open.includes(t)) && !open.includes("Problem Set 6"), `${tag}: the unfinished items planned today are listed: ` + open.join(", "));
      ok(await page.locator("#dlg .wu-it .wu-mv").count() === open.length * 3 && await page.locator('#dlg .wu-mv[aria-pressed="true"]').count() === 0, `${tag}: each has Tomorrow, Pick a Day and Let It Go, none chosen yet`);
      ok(await page.locator("#dlg .wu-first input[type=radio]").count() >= 4 && await page.locator("#dlg .wu-first label", {hasText: "Discussion Post"}).count() === 1, `${tag}: tomorrow's first task can be chosen (Discussion Post is offered)`);
      ok(await page.locator("#dlg .btn.primary").count() === 1 && (await page.textContent("#dlg .btn.primary")).trim() === "Wrap Up", `${tag}: one primary button, Wrap Up`);
      // choices
      await move("Lab Report 4", "tomorrow"); await move("Research Essay Draft", "day"); await move("Read Chapter 7", "go");
      ok(await page.locator("#dlg .wu-it", {hasText: "Research Essay Draft"}).locator(".wu-day").isVisible(), `${tag}: Pick a Day shows a date box`);
      await page.locator("#dlg .wu-it", {hasText: "Research Essay Draft"}).locator("input[type=date]").fill(LATER);
      await move("Read Chapter 7", "tomorrow"); await move("Read Chapter 7", "tomorrow"); await move("Read Chapter 7", "go");
      ok(await page.locator("#dlg .wu-it", {hasText: "Read Chapter 7"}).locator('.wu-mv[aria-pressed="true"]').innerText() === "Let It Go", `${tag}: tapping a choice again clears it; the last tap wins`);
      await page.locator("#dlg .wu-first label", {hasText: "Discussion Post"}).click();
      await page.fill("#wuNote", "Ask Dr. Lee about the lab rubric");
      if (SHOTS) { await page.locator("#dlg .wu-open").scrollIntoViewIfNeeded(); await shot("sheet-choices"); await page.locator("#wuNote").scrollIntoViewIfNeeded(); await shot("sheet-bottom"); }
      const notesBefore = (await store(page)).notes.length;
      await page.click('#dlg [data-act="wrap-done"]'); await page.waitForTimeout(500);

      // 4. After wrapping up
      ok(await page.evaluate(() => !document.querySelector("#dlg[open]")), `${tag}: the sheet closes`);
      ok(/Wrapped up today/.test(await toastText(page)) && await page.isVisible("#toastUndo"), `${tag}: a toast says so, with Undo: ` + await toastText(page));
      const s1 = await store(page), lab = s1.tasks.find(t => t.id === "t2"), essay = s1.tasks.find(t => t.id === "t1"), read = s1.tasks.find(t => t.id === "t3"), disc = s1.tasks.find(t => t.id === "t5");
      ok(lab.pins.some(p => p.date === DAY && p.s === 0 && p.e === 0) && lab.pins.some(p => p.date === NEXT && p.e > p.s), `${tag}: Tomorrow: no time left today and a block pinned tomorrow: ` + JSON.stringify(lab.pins));
      ok(essay.start === LATER && essay.pins.some(p => p.date === LATER && p.e > p.s) && essay.pins.some(p => p.date === DAY && p.e === 0), `${tag}: Pick a Day: it starts that day, with a block pinned there: ` + JSON.stringify({start: essay.start, pins: essay.pins}));
      ok(read && read.status === "todo" && read.due && JSON.stringify(read.pins) === JSON.stringify([{date: DAY, s: 0, e: 0}]), `${tag}: Let It Go only clears today's plan time; the task stays as it was: ` + JSON.stringify(read.pins));
      ok(disc.firstOn === NEXT && disc.pins.some(p => p.date === NEXT && p.e > p.s), `${tag}: the first task is marked for tomorrow with a block pinned there`);
      ok(disc.pins.find(p => p.date === NEXT).s < lab.pins.find(p => p.date === NEXT).s, `${tag}: the first task's block comes before the other moved work`);
      ok(s1.notes.length === notesBefore + 1 && /Ask Dr\. Lee about the lab rubric/.test(s1.notes[s1.notes.length - 1].text), `${tag}: the note is kept as a note`);
      ok(s1.settings.wrapUp && s1.settings.wrapUp.day === DAY, `${tag}: the wrap-up is remembered (synced settings)`);
      const done = page.locator("section.plan .wu-row");
      ok(await done.count() === 1 && (await done.innerText()).trim() === "Wrapped up. See you tomorrow." && await page.locator("section.plan button.wu-row").count() === 0, `${tag}: the row now says "Wrapped up. See you tomorrow." and has no button`);
      await shot("after", "section.plan .wu-row");

      // 5. One Undo puts all of it back
      await page.click("#toastUndo"); await page.waitForTimeout(500);
      const s2 = await store(page);
      ok(["t1", "t2", "t3", "t5"].every(id => !s2.tasks.find(t => t.id === id).pins && !s2.tasks.find(t => t.id === id).firstOn), `${tag}: Undo takes away every pin and the first-task mark`);
      ok(s2.tasks.find(t => t.id === "t1").start === "2026-11-21", `${tag}: Undo puts the essay's start back`);
      ok(s2.notes.length === notesBefore, `${tag}: Undo removes the note`);
      ok(!(s2.settings.wrapUp || {}).day && await page.locator("section.plan button.wu-row").count() === 1, `${tag}: and the row offers Wrap up today again`);
      ok(/Undone/.test(await toastText(page)), `${tag}: says Undone: ` + await toastText(page));
      // Ctrl+Z undoes a wrap-up too (even one that only marks the day)
      await wrapUp(); await page.click('#dlg [data-act="wrap-done"]'); await page.waitForTimeout(400);
      ok(await page.locator("section.plan button.wu-row").count() === 0, `${tag}: a wrap-up with no choices still marks the day`);
      await page.locator("body").click({position: {x: 2, y: 2}}).catch(() => {});
      await page.keyboard.press(process.platform === "darwin" ? "Meta+z" : "Control+z"); await page.waitForTimeout(400);
      ok(await page.locator("section.plan button.wu-row").count() === 1, `${tag}: Ctrl+Z undoes it`);

      // 6. Wrap up for real: Lab Report tomorrow, Discussion Post first
      await wrapUp(); await move("Lab Report 4", "tomorrow"); await page.locator("#dlg .wu-first label", {hasText: "Discussion Post"}).click();
      await page.click('#dlg [data-act="wrap-done"]'); await page.waitForTimeout(400);
      ok((await task(page, "t5")).firstOn === NEXT, `${tag}: wrapped up with Discussion Post first tomorrow`);

      // 7. The next morning: the chosen task is Do This Next, and the row is gone until the evening
      await load(at(NEXT, 9, 0));
      const nu = (await page.textContent("section.plan .next-up .nu-tt")).trim();
      ok(nu === "Discussion Post", `${tag}: next morning, Do This Next is the chosen first task: ` + nu);
      ok(/You chose it to start your day/.test(await page.textContent("section.plan .next-up")), `${tag}: and it says why`);
      ok(await page.locator("section.plan .wu-row").count() === 0, `${tag}: no wrap-up row in the morning`);
      await shot("next-morning", "section.plan .next-up", 240);
      // still first later in the morning, after its pinned block has passed
      await load(at(NEXT, 11, 40));
      ok((await page.textContent("section.plan .next-up .nu-tt")).trim() === "Discussion Post", `${tag}: still first later in the morning`);
      // a focus session on it lets the plan take over again
      await page.evaluate(() => { const H = window.__sbHaptic, t = H.task("t5"); t.history = t.history.concat([{at: Date.now(), text: "Focus session: 25m"}]); H.apply([{kind: "task", id: "t5", after: t}]); });
      await page.waitForTimeout(400);
      ok((await page.textContent("section.plan .next-up .nu-tt")).trim() !== "Discussion Post", `${tag}: after a focus session on it, the plan chooses again`);

      // 8. A day off: no row
      await load(at(NEXT, 22, 20));
      ok(await page.locator("section.plan button.wu-row").count() === 1, `${tag}: the next evening the row is back`);
      await page.evaluate(d => window.__sbWrap.setting("daysOff", {[d]: 1}), NEXT); await page.waitForTimeout(300);
      ok(await page.locator("section.plan .wu-row").count() === 0, `${tag}: not on a day off`);
      await page.evaluate(() => window.__sbWrap.setting("daysOff", {})); await page.waitForTimeout(300);

      // 9. The setting (Settings > Study Plan, shown in Essentials too)
      await page.click('[data-act="menu"]:visible'); await page.waitForSelector("#dlg .us");
      ok(await page.evaluate(() => !!document.querySelector('#dlg .us-pane[data-us="study"] [data-act="wrap-toggle"]')), `${tag}: the switch is in Settings > Study Plan`);
      ok(await page.evaluate(() => document.querySelector('#dlg [data-act="wrap-toggle"]').checked), `${tag}: on by default`);
      await page.evaluate(() => document.querySelector('#dlg [data-act="wrap-toggle"]').click()); await page.waitForTimeout(300);
      ok((await store(page)).settings.wrapUp.off === true, `${tag}: turning it off is saved`);
      await page.keyboard.press("Escape"); await page.waitForTimeout(300);
      ok(await page.locator("section.plan .wu-row").count() === 0, `${tag}: with it off, no row`);
      await load();
      ok(await page.locator("section.plan .wu-row").count() === 0, `${tag}: still off after a reload`);
      ok(!errs.length, `${tag}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nwrap-up.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
