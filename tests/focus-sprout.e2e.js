// node tests/focus-sprout.e2e.js  Focus Sprout grows through five stages in the Focus timer, waits while the student is away
// (Strict Sprout wilts it after a minute away), finished sessions go on the week's Focus Garden shelf (Focus sheet and Insights),
// and Block Distracting Apps calls the phone app's focusGuard (a stub here) when a session starts, pauses and ends.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const MIN = 60000;

async function newPage(browser, w, h, mob, opts){
  opts = opts || {};
  const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, reducedMotion: opts.reduce ? "reduce" : "no-preference"});
  await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
  await ctx.addInitScript(guard => {
    window.__SB_TEST = true; window.__SB_SPROUT = true;   // the sprout is off by default (01-focus-sprout.js); these tests turn it on
    const p = n => String(n).padStart(2, "0"), d = new Date(Date.now() + 3 * 864e5), due = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}],
      tasks: [{id: "t1", title: "Lab Report", courseId: "c1", type: "Assignment", start: "", due, time: "", priority: "med", status: "todo", notes: "", hours: 3, checklist: [], pct: 0, dependsOn: [], history: [], created: Date.now(), order: 10}], settings: {}}));
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
    window.__fg = [];
    // the phone app's plugin, as native-bridge.js defines it (here a stub that records its calls)
    if (guard) window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {focusGuard: {
      available: async () => guard, pickApps: async () => { window.__fg.push(["pickApps"]); return true; },
      start: async o => { window.__fg.push(["start", o]); return true; }, stop: async () => { window.__fg.push(["stop"]); return true; }}});
  }, opts.guard || null);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(opts.base); await page.waitForFunction(() => window.__sbPomo && window.__sbSprout && document.querySelector("#pomoBtn"), null, {timeout: 40000});
  await page.waitForTimeout(600);
  return {ctx, page, errs};
}
const openTimer = page => page.evaluate(() => { const d = document.querySelector("#pomoDlg"); if (!d.open) document.querySelector("#pomoBtn").click(); });
const openSettings = page => page.evaluate(() => { const d = document.querySelector("#pomoSetD"); if (d && !d.open) { d.open = true; d.dispatchEvent(new Event("toggle")); } });
const pickTask = page => page.evaluate(() => { const s = document.querySelector("#pomoTask"); s.value = "t1"; s.dispatchEvent(new Event("change", {bubbles: true})); });
const go = page => page.evaluate(() => document.querySelector("#pomoDlg .pomo-go").click());
// moves the running session on: `done` minutes of its length have passed
const elapse = (page, done) => page.evaluate(done => { const P = __sbPomo, p = P.pomo; p.endAt = Date.now() + (Number(p.len) - done * 60000); P.save(); }, done);
const dial = page => page.evaluate(() => { const e = document.querySelector("#spDial"); return e ? {k: e.dataset.k, label: e.getAttribute("aria-label"), pot: (e.querySelector("svg").getAttribute("style") || "")} : null; });
const setHidden = (page, h) => page.evaluate(h => {
  Object.defineProperty(document, "hidden", {configurable: true, get: () => h});
  Object.defineProperty(document, "visibilityState", {configurable: true, get: () => h ? "hidden" : "visible"});
  document.dispatchEvent(new Event("visibilitychange"));
}, h);
// time away: the page was left `min` minutes ago
const awayFor = (page, min) => page.evaluate(min => { const s = __sbSprout.sp; s.hidAt = Date.now() - min * 60000; }, min);
const note = page => page.evaluate(() => { const e = document.querySelector("#spNote"); return e && !e.hidden ? e.textContent : ""; });

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, h, mob] of [[402, 874, true], [1300, 860, false]]) {
      const {ctx, page, errs} = await newPage(browser, w, h, mob, {base, guard: {dnd: true, apps: false}});
      await openTimer(page); await pickTask(page);
      let d = await dial(page);
      ok(d && d.k === "1", `${w}px: before a session the timer's dial shows a seed in its pot: ` + JSON.stringify(d));
      ok(/--pot:#1E9E74/i.test(d.pot), `${w}px: the pot is the course's colour`);

      // Block Distracting Apps: shown because the stub says Do Not Disturb is available; off until switched on
      await openSettings(page); await page.waitForTimeout(300);
      ok(await page.evaluate(() => !!document.querySelector("#psGuard") && !document.querySelector("#psGuard").checked), `${w}px: Timer Settings has the Block distracting apps row, off`);
      ok(await page.evaluate(() => /Do Not Disturb/.test(document.querySelector(".fg-row").textContent) && !document.querySelector('[data-act="fg-pick"]')), `${w}px: on Android (dnd only) it explains Do Not Disturb and has no Choose Apps`);
      await page.evaluate(() => document.querySelector("#psGuard").click()); await page.waitForTimeout(200);
      ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studioso:focusguard")).on === true), `${w}px: switching it on is kept on this device`);

      // a 25-minute session starts: the guard starts with the session's end time
      await go(page); await page.waitForTimeout(500);
      const endAt = await page.evaluate(() => __sbPomo.pomo.endAt);
      let fg = await page.evaluate(() => window.__fg);
      ok(fg.length === 1 && fg[0][0] === "start" && fg[0][1].until === endAt && fg[0][1].dnd === true && fg[0][1].apps === false, `${w}px: starting a focus session calls focusGuard.start({until: session end, dnd: true, apps: false}): ` + JSON.stringify(fg));

      // five stages as the session runs
      const seen = [];
      for (const [mins, want] of [[1, "1"], [6, "2"], [11, "3"], [16, "4"], [21, "5"]]) {
        await elapse(page, mins); await page.waitForTimeout(1300);
        d = await dial(page); seen.push(d.k);
        ok(d.k === want, `${w}px: after ${mins} of 25 minutes the sprout is at stage ${want} (${d.label})`);
      }
      ok(/stage 5 of 5/.test(d.label), `${w}px: the sprout has a spoken label: ${d.label}`);
      ok(await page.evaluate(() => { const s = document.querySelector("#spDial svg"); s.classList.add("sp-new"); return getComputedStyle(s).animationName === "spGrow"; }), `${w}px: with motion on, a new stage grows in (spGrow)`);

      // pause stops the guard; resuming starts it again with the new end time
      await page.evaluate(() => document.querySelector('#pomoDlg [data-act="pomo-pause"]').click()); await page.waitForTimeout(400);
      fg = await page.evaluate(() => window.__fg);
      ok(fg[fg.length - 1][0] === "stop", `${w}px: pausing calls focusGuard.stop()`);
      await page.evaluate(() => document.querySelector('#pomoDlg [data-act="pomo-start"]').click()); await page.waitForTimeout(400);
      fg = await page.evaluate(() => window.__fg);
      const end2 = await page.evaluate(() => __sbPomo.pomo.endAt);
      ok(fg[fg.length - 1][0] === "start" && fg[fg.length - 1][1].until === end2, `${w}px: resuming calls start again with the new end time`);

      // leaving pauses the growth; coming back says so kindly
      await elapse(page, 8); await page.waitForTimeout(1200);
      const before = (await dial(page)).k;   // stage 2 (8 of 25 minutes)
      await setHidden(page, true);
      ok(await page.evaluate(() => __sbSprout.sp.hidAt > 0), `${w}px: leaving the tab is noted`);
      // 6 minutes pass while away
      await awayFor(page, 6); await elapse(page, 14); await page.waitForTimeout(1200);
      ok((await dial(page)).k === before, `${w}px: while away the sprout doesn't grow (still stage ${before})`);
      await setHidden(page, false); await page.waitForTimeout(400);
      ok(/Welcome back\. Your sprout waited for you\./.test(await note(page)), `${w}px: coming back says "Welcome back. Your sprout waited for you."`);
      const sp = await page.evaluate(() => ({away: __sbSprout.sp.away, wilted: __sbSprout.sp.wilted, k: __sbSprout.stageNow()}));
      ok(Math.abs(sp.away - 6 * MIN) < 3000 && !sp.wilted && sp.k === 2, `${w}px: the 6 minutes away don't count (8 of 25 minutes grown, stage 2): ` + JSON.stringify(sp));
      // a glance away of a few seconds is ignored
      await setHidden(page, true); await awayFor(page, 0.05); await setHidden(page, false);
      ok(await page.evaluate(() => Math.abs(__sbSprout.sp.away - 6 * 60000) < 3000), `${w}px: a 3-second glance away isn't counted`);

      // the session finishes: the alarm shows what grew, and it goes on the shelf
      await elapse(page, 24.98); await page.waitForSelector("#alarmDlg[open] .sp-alarm", {timeout: 5000});
      const al = await page.evaluate(() => ({art: document.querySelector("#alarmDlg .sp-alarm").getAttribute("class"), line: document.querySelector("#alarmDlg .sp-alarm-line").textContent}));
      ok(/s-4/.test(al.art) && /grew into a young plant/.test(al.line), `${w}px: the finished session shows the plant it grew (19 of 25 minutes: a young plant): ` + JSON.stringify(al));
      fg = await page.evaluate(() => window.__fg);
      ok(fg[fg.length - 1][0] === "stop", `${w}px: the session ending calls focusGuard.stop()`);
      await page.evaluate(() => { document.querySelector("#alOk").click(); }); await page.waitForTimeout(300);
      const g1 = await page.evaluate(() => { const S = __sbSprout.weekData(); return {n: S.n, grown: S.grown, sp: __sbSprout.sp}; });
      ok(g1.n === 1 && g1.grown === 1 && !g1.sp, `${w}px: the plant is on this week's shelf and the sprout is cleared: ` + JSON.stringify(g1));
      ok(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")).settings.garden; const v = Object.values(s); return v.length === 1 && v[0][0] === "4c1"; }), `${w}px: the garden is saved compactly with the focus stats (stage then course id)`);

      // Strict Sprout: wilts after a minute away
      await openTimer(page); await openSettings(page); await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelector("#psStrict").click()); await page.waitForTimeout(200);
      ok(await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).settings.sprout.strict === true), `${w}px: Strict Sprout is a setting`);
      await page.evaluate(() => { const P = __sbPomo; if (P.pomo.mode !== "focus") { P.pomo.mode = "focus"; P.pomo.running = false; P.pomo.left = 0; P.pomo.len = 0; P.save(); } P.render(); });
      await pickTask(page); await go(page); await page.waitForTimeout(400);
      await elapse(page, 3); await setHidden(page, true); await awayFor(page, 0.5); await setHidden(page, false); await page.waitForTimeout(300);
      ok(!(await page.evaluate(() => __sbSprout.sp.wilted)) && /Welcome back/.test(await note(page)), `${w}px: Strict: 30 seconds away is fine`);
      await setHidden(page, true); await awayFor(page, 1.5); await setHidden(page, false); await page.waitForTimeout(1300);
      d = await dial(page);
      ok(d.k === "w" && /wilted/.test(d.label), `${w}px: Strict: 90 seconds away wilts the sprout: ` + JSON.stringify(d));
      ok(/wilted while you were away/.test(await note(page)), `${w}px: Strict: it says so kindly: ${await note(page)}`);
      await elapse(page, 20); await page.waitForTimeout(1200);
      ok((await dial(page)).k === "w", `${w}px: Strict: it stays wilted for the rest of the session`);
      await elapse(page, 24.98); await page.waitForSelector("#alarmDlg[open] .sp-alarm", {timeout: 5000});
      ok(await page.evaluate(() => /s-w/.test(document.querySelector("#alarmDlg .sp-alarm").getAttribute("class")) && /dry sprout/.test(document.querySelector("#alarmDlg .sp-alarm-line").textContent)), `${w}px: Strict: the finished session shows a dry sprout`);
      await page.evaluate(() => { document.querySelector("#alOk").click(); }); await page.waitForTimeout(300);

      // the shelf in the Focus sheet
      await openTimer(page); await page.waitForTimeout(300);
      const shelf = await page.evaluate(() => { const g = document.querySelector("#pomoDlg .sp-garden"); if (!g) return null; const r = g.getBoundingClientRect(), sh = g.querySelector(".sg-shelf");
        return {sum: g.querySelector(".sg-sum").textContent, plants: g.querySelectorAll(".sg-p").length, dry: g.querySelectorAll(".sg-p.s-w").length, young: g.querySelectorAll(".sg-p.s-4").length, days: g.querySelectorAll(".sg-day").length, aria: sh.getAttribute("aria-label"), left: r.left, right: r.right, sw: sh.scrollWidth, cw: sh.clientWidth}; });
      ok(shelf && shelf.sum === "1 plant and 1 dry sprout this week" && shelf.plants === 2 && shelf.dry === 1 && shelf.young === 1 && shelf.days === 7, `${w}px: the Focus sheet shows the week's Focus Garden: ` + JSON.stringify(shelf));
      ok(/^Focus Garden: 1 plant and 1 dry sprout this week\./.test(shelf.aria), `${w}px: the shelf has a spoken summary`);
      ok(shelf.left >= 0 && shelf.right <= w && shelf.sw <= shelf.cw + 1, `${w}px: the shelf fits the screen`);
      // and in Insights > This Week
      await page.evaluate(() => { document.querySelector("#pomoDlg").close(); const b = document.createElement("button"); b.dataset.act = "pro-ins-open"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForTimeout(500);
      ok(await page.evaluate(() => { const g = document.querySelector(".pro-ins-body .sp-garden"); return !!g && g.querySelectorAll(".sg-p").length === 2; }), `${w}px: Insights (This Week) shows the Focus Garden`);
      await page.evaluate(() => document.querySelector('[data-act="pro-ins-kind"][data-id="term"]').click()); await page.waitForTimeout(300);
      ok(await page.evaluate(() => !document.querySelector(".pro-ins-body .sp-garden")), `${w}px: This Term doesn't show the week's shelf`);
      await page.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); });

      // a stopped session plants nothing and stops the guard
      await openTimer(page); await pickTask(page); await go(page); await page.waitForTimeout(400); await elapse(page, 10);
      await page.evaluate(() => document.querySelector('#pomoDlg [data-act="pomo-reset"]').click()); await page.waitForTimeout(500);
      fg = await page.evaluate(() => window.__fg);
      ok(await page.evaluate(() => !__sbSprout.sp && __sbSprout.weekData().n === 2) && fg[fg.length - 1][0] === "stop", `${w}px: resetting a session drops its sprout (nothing planted) and stops the guard`);
      ok(!errs.length, `${w}px: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }

    // iPhone: apps to choose. Switching it on asks for the apps first; the session then blocks them
    {
      const {ctx, page, errs} = await newPage(browser, 402, 874, true, {base, guard: {dnd: false, apps: true}});
      await openTimer(page); await openSettings(page); await page.waitForTimeout(300);
      ok(await page.evaluate(() => /apps you choose/.test(document.querySelector(".fg-row").textContent) && document.querySelector('[data-act="fg-pick"]').textContent === "Choose Apps"), "iPhone (apps only): the row explains blocking the apps you choose, with Choose Apps");
      await page.evaluate(() => document.querySelector("#psGuard").click()); await page.waitForTimeout(400);
      ok(await page.evaluate(() => window.__fg[0][0] === "pickApps" && JSON.parse(localStorage.getItem("studioso:focusguard")).picked === true), "iPhone: switching it on opens the app picker (pickApps)");
      await pickTask(page); await go(page); await page.waitForTimeout(500);
      const fg = await page.evaluate(() => window.__fg);
      ok(fg[1] && fg[1][0] === "start" && fg[1][1].apps === true && fg[1][1].dnd === false, "iPhone: the session calls start({apps: true, dnd: false}): " + JSON.stringify(fg));
      ok(!errs.length, "iPhone: no page errors: " + errs.join(" | "));
      await ctx.close();
    }

    // Web and desktop (no plugin): no row. Reduced motion: stages change without animation
    {
      const {ctx, page, errs} = await newPage(browser, 1300, 860, false, {base, reduce: true});
      await openTimer(page); await openSettings(page); await page.waitForTimeout(300);
      ok(await page.evaluate(() => !document.querySelector("#psGuard") && !!document.querySelector("#psStrict")), "without the phone plugin the Block distracting apps row is hidden (Strict Sprout is still there)");
      await pickTask(page); await go(page); await page.waitForTimeout(300); await elapse(page, 6); await page.waitForTimeout(1300);
      const an = await page.evaluate(() => { const s = document.querySelector("#spDial svg"); s.classList.add("sp-new"); const cs = getComputedStyle(s); return {k: document.querySelector("#spDial").dataset.k, cls: s.getAttribute("class"), name: cs.animationName, dur: parseFloat(cs.animationDuration)}; });
      ok(an.k === "2" && /sp-new/.test(an.cls) && (an.name === "none" || an.dur < 0.01), "reduced motion: the stage changes with no grow animation: " + JSON.stringify(an));
      ok(!errs.length, "reduced motion: no page errors: " + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nfocus-sprout.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
