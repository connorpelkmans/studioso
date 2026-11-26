// node tests/essentials.e2e.js  A calmer first week: a new install starts in Essentials (Board, Calendar, Review and Courses, the
// rest under More), features turn on as they become relevant and say so once, Settings > Show Everything turns it off and on,
// and an existing install keeps exactly the menu and Today's Plan it had. Phone (402x874) and desktop (1300x860).
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
const iso = k => { const d = new Date(); d.setDate(d.getDate() + k); return d.toISOString().slice(0, 10); };
const OLD = Date.now() - 40 * 864e5;
// An existing student's planner, as the other tests seed it: tasks, and the welcome setup and tour already done
const EXISTING = {v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}],
  tasks: [{id: "t1", title: "Lab report", courseId: "c1", type: "Assignment", due: iso(1), est: 90, status: "todo", created: OLD},
    {id: "t2", title: "Reading", courseId: "c1", type: "Reading", due: iso(3), est: 60, status: "todo", created: OLD}], settings: {}};
const FLAGS = {"sb:onboarded": "1", "studioso:welcomed": "1", "studioso:sb": '"local"', "studyboard:tour": "done"};
// What every student saw before Essentials existed (and an existing student still sees)
const ALL_TABS = {phone: ["board", "plan", "flashcards", "notes", "courses", "companion", "groups"], desktop: ["board", "plan", "flashcards", "notes", "courses", "companion", "groups", "navPomo"]};
const MAIN_TABS = {phone: ["board", "plan", "flashcards", "courses", "ess-more"], desktop: ["board", "plan", "flashcards", "courses", "ess-more", "navPomo"]};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (w, h, mob, init) => {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob});
    await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
    if (init) await ctx.addInitScript(init.fn, init.arg);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBESS && document.querySelector("#view > *"), null, {timeout: 40000}); await page.waitForTimeout(1200);
    return {ctx, page};
  };
  // the welcome setup, skipped the way a student would
  const skipSetup = async page => {
    for (let k = 0; k < 6 && await page.locator("dialog[open]").count(); k++) {
      for (const sel of ['dialog[open] .sheet-head [data-act="close"]', '[data-ob="skip"]', ".sheet.ob .ob-foot .btn.primary"]) {
        const b = page.locator(sel).first(); if (await b.count() && await b.isVisible()) { await b.click(); await page.waitForTimeout(500); break; }
      }
    }
    await page.waitForTimeout(400);
  };
  const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : ""; }, sel);
  const tabs = page => page.evaluate(() => [...document.querySelectorAll("nav.tabs .in > *")].filter(b => b.offsetParent).map(b => b.dataset.tab || b.id || b.className));
  const toastText = page => page.evaluate(() => { const t = document.getElementById("toast"); return t && t.classList.contains("show") ? document.getElementById("toastMsg").textContent : ""; });
  const openSettingsRow = async page => {
    await page.evaluate(() => [...document.querySelectorAll('[data-act="menu"]')].find(x => x.offsetParent).click()); await page.waitForTimeout(600);
    await page.evaluate(() => { const c = [...document.querySelectorAll("dialog[open] button")].find(b => /^\s*Appearance/.test(b.textContent)); if (c) c.click(); }); await page.waitForTimeout(500);
    return page.locator('dialog[open] input[data-act="ess-toggle"]');
  };
  try {
    for (const [w, h, mob, tag] of [[402, 874, true, "phone"], [1300, 860, false, "desktop"]]) {
      /* A new install */
      {
        const {ctx, page} = await open(w, h, mob);
        ok(await page.evaluate(() => SBESS.on() && document.documentElement.dataset.ess === "on" && SBESS.state().why === "new"), `${tag}: a new install starts in Essentials`);
        await skipSetup(page);
        ok(JSON.stringify(await tabs(page)) === JSON.stringify(MAIN_TABS[tag]), `${tag}: the menu is Board, Calendar, Review, Courses and More: ` + (await tabs(page)).join(","));
        if (tag === "desktop") ok(await page.evaluate(() => !document.querySelector("nav.tabs .calc-btn").offsetParent && !document.querySelector('nav.tabs .nav-foot [data-act="shop"]').offsetParent), `${tag}: Calculator and Style wait under More`);
        ok(await page.locator("#view .gs-unl").count() === 1 && /Flashcards[\s\S]*Notes[\s\S]*Groups[\s\S]*Exam Prep/.test(await txt(page, "#view .gs-unl")) && !/Make a note|Select a theme/.test(await txt(page, "#view .gs-card")),
          `${tag}: Getting Started links to what turns on as you go instead of listing everything`);

        // More, by keyboard: a dialog with the hidden tabs and tools; Escape gives focus back to More
        await page.focus("nav.tabs .ess-more"); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
        const sheet = await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d && {text: d.innerText, ids: [...d.querySelectorAll("[data-act]")].map(b => b.dataset.act + ":" + (b.dataset.id || ""))}; });
        ok(sheet && ["ess-go:notes", "ess-go:companion", "ess-go:groups", "calc-open:", "shop:", "ess-all:"].every(k => sheet.ids.includes(k)), `${tag}: More opens Notes, Companion, Groups, Calculator, Style Shop and Show Everything: ` + (sheet && sheet.ids.join(",")));
        ok(await page.getAttribute("nav.tabs .ess-more", "aria-expanded") === "true" && await page.getAttribute("nav.tabs .ess-more", "aria-haspopup") === "dialog", `${tag}: More says it opens a dialog, and that it's open`);
        await page.keyboard.press("Escape"); await page.waitForTimeout(400);
        ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("ess-more")) && await page.getAttribute("nav.tabs .ess-more", "aria-expanded") === "false", `${tag}: Escape closes it and focus is back on More`);

        // More opens a hidden tab; More is the menu item for that page
        await page.click("nav.tabs .ess-more"); await page.waitForTimeout(400);
        await page.click('dialog[open] [data-act="ess-go"][data-id="notes"]'); await page.waitForTimeout(700);
        ok(await page.evaluate(() => document.body.dataset.view) === "notes" && await page.getAttribute("nav.tabs .ess-more", "aria-current") === "page", `${tag}: More opens Notes, and marks itself as the current page`);
        ok(!(await tabs(page)).includes("notes"), `${tag}: just opening Notes doesn't add it to the menu`);

        // The first note: Notes turns on, said once in one line
        await page.click("#fab"); await page.waitForTimeout(700);
        await page.keyboard.type("Ask about lab partners"); await page.waitForTimeout(200);
        await page.mouse.click(4, Math.round(h / 3)); await page.waitForTimeout(400);
        await page.waitForFunction(() => document.getElementById("toast").classList.contains("show") && /Notes now has its own tab/.test(document.getElementById("toastMsg").textContent), null, {timeout: 8000});
        ok(true, `${tag}: the first note turns Notes on, announced in one line`);
        ok((await tabs(page)).includes("notes") && await page.evaluate(() => SBESS.unlocked("notes") && SBESS.said("unlock:notes")), `${tag}: Notes is in the menu now`);
        await page.reload(); await page.waitForFunction(() => window.SBESS && document.querySelector("#view > *")); await page.waitForTimeout(2500);
        ok((await tabs(page)).includes("notes") && !/Notes now has/.test(await toastText(page)), `${tag}: after a reload it stays on and isn't announced again`);

        // Search finds a hidden feature, opens it and turns it on
        await page.evaluate(() => [...document.querySelectorAll('[data-act="search"]')].find(x => x.offsetParent).click()); await page.waitForTimeout(500);
        await page.keyboard.type("Companion"); await page.waitForTimeout(700);
        ok(/Go to Companion/.test(await txt(page, "#sxList")), `${tag}: Search finds Companion while it's under More`);
        await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
        ok(await page.evaluate(() => document.body.dataset.view) === "companion" && (await tabs(page)).includes("companion"), `${tag}: opening it from Search opens it and puts it in the menu`);

        // Show Everything, from Settings: off, then back on
        const row = await openSettingsRow(page);
        ok(await row.count() === 1 && !(await row.isChecked()), `${tag}: Settings > Appearance has Show Everything, off`);
        await row.click(); await page.waitForTimeout(600);
        await page.keyboard.press("Escape"); await page.waitForTimeout(500);
        ok(await page.evaluate(() => !SBESS.on() && !document.documentElement.dataset.ess) && JSON.stringify(await tabs(page)) === JSON.stringify(ALL_TABS[tag]), `${tag}: Show Everything puts every tab back: ` + (await tabs(page)).join(","));
        const row2 = await openSettingsRow(page);
        ok(await row2.isChecked(), `${tag}: and the row says so`);
        await row2.click(); await page.waitForTimeout(600); await page.keyboard.press("Escape"); await page.waitForTimeout(500);
        const back = await tabs(page);
        ok(await page.evaluate(() => SBESS.on()) && back.includes("ess-more") && !back.includes("groups") && back.includes("notes"), `${tag}: turning it off again goes back to the essentials, keeping what's already on: ` + back.join(","));
        ok(!page.errs.length, `${tag}: no page errors: ` + page.errs.join(" | "));
        await ctx.close();
      }
      /* A new student with an exam in 6 days: one Exam Prep card, dismissed for good */
      {
        const {ctx, page} = await open(w, h, mob, {fn: ([flags, exam]) => {
          if (localStorage.getItem("sb:ess")) return;
          localStorage.setItem("sb:ess", JSON.stringify({on: true, why: "new", at: Date.now(), unl: {}, said: {}}));
          Object.entries(flags).forEach(([k, v]) => localStorage.setItem(k, v));
          localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [{id: "ex1", title: "Biology midterm", courseId: "c1", type: "Exam", due: exam, time: "09:00", status: "todo", created: Date.now()}], settings: {}}));
        }, arg: [FLAGS, iso(6)]});
        ok(await page.locator(".ess-exam").count() === 1 && /Exam Prep is on\.[\s\S]*Biology midterm is in 6 days/.test(await txt(page, ".ess-exam")), `${tag}: an exam within 14 days introduces Exam Prep with one card`);
        await page.click('.ess-exam [data-act="ess-exam-x"]'); await page.waitForTimeout(400);
        ok(await page.locator(".ess-exam").count() === 0, `${tag}: the card can be dismissed`);
        await page.reload(); await page.waitForFunction(() => window.SBESS && document.querySelector("#view > *")); await page.waitForTimeout(1200);
        ok(await page.locator(".ess-exam").count() === 0 && await page.evaluate(() => SBESS.on() && SBESS.unlocked("examprep")), `${tag}: and stays dismissed; Exam Prep stays on`);
        ok(!page.errs.length, `${tag}: no page errors: ` + page.errs.join(" | "));
        await ctx.close();
      }
      /* An existing install: everything as before */
      {
        const {ctx, page} = await open(w, h, mob, {fn: ([seed, flags]) => { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); Object.entries(flags).forEach(([k, v]) => localStorage.setItem(k, v)); } }, arg: [EXISTING, FLAGS]});
        ok(await page.evaluate(() => !SBESS.on() && SBESS.state().why === "existing" && !document.documentElement.dataset.ess), `${tag}: an existing install isn't put in Essentials`);
        ok(JSON.stringify(await tabs(page)) === JSON.stringify(ALL_TABS[tag]), `${tag}: it keeps every tab, with no More: ` + (await tabs(page)).join(","));
        ok(await page.locator('#view .pf-link[data-id="how"]').count() === 1 && await page.locator("#view .gs-unl, #view .ess-card").count() === 0, `${tag}: Today's Plan is unchanged (How This Is Ranked is there, nothing new is added)`);
        if (tag === "desktop") ok(await page.evaluate(() => !!document.querySelector("nav.tabs .calc-btn").offsetParent && !!document.querySelector('nav.tabs .nav-foot [data-act="shop"]').offsetParent), `${tag}: Calculator and Style stay in the sidebar`);
        const row = await openSettingsRow(page);
        ok(await row.isChecked(), `${tag}: Show Everything is on for them`);
        ok(!page.errs.length, `${tag}: no page errors: ` + page.errs.join(" | "));
        await ctx.close();
      }
    }
    /* The tour, in Essentials, only points at what's on screen */
    {
      const {ctx, page} = await open(1300, 860, false);
      await skipSetup(page);
      await page.evaluate(() => SBTOUR.start()); await page.waitForTimeout(800);
      const seen = [];
      for (let k = 0; k < 14 && await page.evaluate(() => SBTOUR.active()); k++) {
        const s = await page.evaluate(() => { const r = document.querySelector("#sbTour .tour-spot"), b = r && r.getBoundingClientRect(); return {t: document.getElementById("tourT").textContent, spot: !!b && b.width > 2 && getComputedStyle(r).display !== "none"}; });
        seen.push(s);
        await page.click('#sbTour [data-tour="next"]'); await page.waitForTimeout(700);
      }
      const titles = seen.map(s => s.t);
      ok(titles.includes("More") && !titles.includes("Notes Board") && !titles.includes("Style Shop"), "the tour shows More and skips Notes and the Style Shop while they're under More: " + titles.join(" / "));
      ok(!page.errs.length, "tour: no page errors: " + page.errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nessentials.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
