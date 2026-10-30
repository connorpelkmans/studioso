// Phone design: done bar, course cards, grouped Settings, drawn empty states, scroll header, segmented switches, first-run welcome
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } else console.log("ok -", m); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const COURSES = [["c1", "Biology 101", "BIO101", "#4F8A5B"], ["c2", "Calculus II", "MATH152", "#3B6FD8"], ["c3", "Intro Psychology", "PSY100", "#C2577A"], ["c4", "English Composition", "ENG110", "#D98A2B"], ["c5", "World History", "HIST120", "#7A5BC2"]]
  .map(([id, name, code, color]) => ({id, name, code, color}));
const D = n => { const d = new Date("2026-10-23T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const T = (id, title, courseId, type, due, o) => Object.assign({id, title, courseId, type, start: D(-3), due: D(due), time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10}, o || {});
const TASKS = [T("t1", "Lab report: enzyme kinetics", "c1", "Assignment", 0, {time: "23:59", hours: 3}), T("t2", "Problem set 7", "c2", "Assignment", 1), T("t3", "Read chapter 6", "c3", "Reading", 1, {hours: 1.5}),
  T("t4", "Essay outline", "c4", "Assignment", 2), T("t5", "Primary source response", "c5", "Assignment", 4), T("t6", "WebAssign 7.3", "c2", "Homework", 3, {hours: 1}), T("t7", "Problem set 6", "c2", "Assignment", -2, {status: "done", pct: 100, doneAt: 1})];
const seed = ([data, fresh]) => {
  if (fresh) return;
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(data));
};
const dataOf = (empty, skin) => ({v: 2, courses: empty ? [] : COURSES, tasks: empty ? [] : TASKS, files: [], notes: [], decks: [], events: [], settings: Object.assign({capacity: 15, dailyHours: 4}, skin ? {style: {skin}} : {}), updated: 1});
async function open(browser, o = {}){
  const W = o.w || 390, phone = W < 640;
  const ctx = await browser.newContext({viewport: {width: W, height: phone ? 844 : 860}, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block", hasTouch: phone, isMobile: phone, colorScheme: o.dark ? "dark" : "light", reducedMotion: o.reduce ? "reduce" : "no-preference"});
  await ctx.route(/supabase\.co/, r => r.abort());
  const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message)); p.errs = errs;
  await p.clock.install({time: new Date("2026-10-23T10:30:00-04:00")});
  await p.addInitScript(seed, [dataOf(o.empty, o.skin), !!o.fresh]);
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForSelector("#view", {state: "attached"}); await wait(o.fresh ? 600 : 1500);
  return {ctx, p};
}
const tab = async (p, t) => { await p.evaluate(t => document.querySelector(`nav.tabs [data-tab="${t}"]`).click(), t); await wait(500); };
const box = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, r: r.right, vis: !!(r.width && r.height) && getComputedStyle(e).visibility !== "hidden"}; }, sel);
const noOverflow = async (p, tag) => ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: no sideways page scroll`);

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    for (const dark of [false, true]) {
      const tag = dark ? "390 dark" : "390";
      /* 06 done bar and compact time prompt */
      {
        const {ctx, p} = await open(browser, {dark});
        await p.click('.plan-row .check[data-id="t2"], .check[data-id="t2"]');
        ok(await p.evaluate(() => !!document.querySelector(".check.sb-pop")), `06 (${tag}): the check pops when it's finished`);
        ok(await p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).tasks.find(t => t.id === "t2").status === "done"), `06 (${tag}): the task is saved as done right away`);
        await wait(900);
        const t = await box(p, "#toast"), nav = await box(p, "nav.tabs"), u = await box(p, "#toastUndo");
        ok(await p.evaluate(() => document.querySelector("#toast").classList.contains("toast-done")), `06 (${tag}): the done bar has the green check`);
        ok(t && nav && t.b <= nav.y && nav.y - t.b < 30 && t.x <= 14 && t.r >= 376, `06 (${tag}): the done bar is full width just above the tab bar: ` + JSON.stringify({t, nav: nav && nav.y}));
        ok(u && u.vis && u.h >= 40, `06 (${tag}): Undo is a 40px button: ` + (u && u.h));
        const chip = await p.evaluate(() => { const a = document.querySelector("#accChip"); if (!a || a.hidden) return null; const opts = [...a.querySelectorAll(".acc-opt")].map(b => b.getBoundingClientRect()), q = a.querySelector(".acc-q").getBoundingClientRect(); return {top: a.getBoundingClientRect().top, bottom: a.getBoundingClientRect().bottom, rows: new Set(opts.map(r => Math.round(r.top))).size, minH: Math.min(...opts.map(r => r.height)), qh: q.height, names: [...a.querySelectorAll(".acc-opt")].map(b => b.innerText.trim())}; });
        ok(chip && chip.rows === 1 && chip.minH >= 44 && chip.qh < 30, `06 (${tag}): How long did it take is one line with the answers in one row: ` + JSON.stringify(chip));
        ok(chip && (chip.bottom <= t.y || t.b <= chip.top), `06 (${tag}): the time prompt and the done bar don't overlap`);
        await noOverflow(p, `06 (${tag})`);
        ok(!p.errs.length, `06 (${tag}): no page errors: ` + p.errs.join(" | "));
        await ctx.close();
      }
      /* 08 compact course cards */
      {
        const {ctx, p} = await open(browser, {dark});
        await tab(p, "courses");
        const cards = await p.evaluate(() => [...document.querySelectorAll("#view .c2-card")].map(c => { const r = c.getBoundingClientRect(), ring = c.querySelector(".c2-ring").getBoundingClientRect(), vis = s => { const e = c.querySelector(s); return !!e && e.getBoundingClientRect().height > 0; }; return {h: r.height, ring: [ring.width, ring.height], code: vis(".c2-code"), mini: vis(".c2-mini"), prog: vis(".body > .prog"), next: vis(".next"), act: c.dataset.act}; }));
        ok(cards.length === 5 && cards.every(c => c.h <= 112 && c.ring[0] === 48 && c.code && c.mini && !c.prog && c.next && c.act === "open-course"), `08 (${tag}): five compact cards with a 48px ring, code, Next line and a mini progress bar: ` + JSON.stringify(cards[0]));
        ok(await p.evaluate(() => { const c = document.querySelector("#view .c2-card"), b = c.querySelector(".c2-band").getBoundingClientRect(); return b.width <= 8 && b.height > 60; }), `08 (${tag}): the colour band is a stripe down the side`);
        await p.click("#view .c2-card"); await wait(400);
        ok(await p.evaluate(() => !!document.querySelector("#view .c2-head")), `08 (${tag}): tapping a card still opens the course`);
        await noOverflow(p, `08 (${tag})`);
        ok(!p.errs.length, `08 (${tag}): no page errors: ` + p.errs.join(" | "));
        await ctx.close();
      }
      /* 09 Settings as one grouped list, 11 header, 12 segmented */
      {
        const {ctx, p} = await open(browser, {dark});
        await p.evaluate(() => scrollTo(0, 600)); await wait(400);
        const hd = await p.evaluate(() => { const h = document.querySelector("header.top"), s = h.querySelector(".top-sec"), bg = getComputedStyle(h).backgroundColor; return {on: document.body.classList.contains("sb-scrolled"), sec: s && s.textContent, secVis: !!s && s.getBoundingClientRect().width > 0, date: document.getElementById("todayLabel").getBoundingClientRect().height, logo: h.querySelector("img.logo").getBoundingClientRect().width, line: getComputedStyle(h).borderBottomWidth, bg}; });
        ok(hd.on && hd.secVis && hd.sec === "Today's Plan" && hd.date === 0 && hd.logo < 110 && hd.line === "1px", `11 (${tag}): scrolled, the header shows a small logo and the page name instead of the date: ` + JSON.stringify(hd));
        await p.evaluate(() => scrollTo(0, 0)); await wait(300);
        ok(await p.evaluate(() => !document.body.classList.contains("sb-scrolled") && document.getElementById("todayLabel").getBoundingClientRect().height > 0), `11 (${tag}): at the top the date is back`);
        await p.evaluate(() => [...document.querySelectorAll("#view .bview-tabs button")].find(b => /Task Board/.test(b.textContent)).click()); await wait(400);
        const seg = await p.evaluate(() => [...document.querySelectorAll("#view .segb > button, #view .pt-bar > .pt-tab")].filter(b => b.offsetWidth).map(b => { const r = b.getBoundingClientRect(), a = getComputedStyle(b, "::before"); return {hit: r.height, seen: r.height - parseFloat(a.top) - parseFloat(a.bottom), on: b.getAttribute("aria-pressed") === "true" || b.getAttribute("aria-selected") === "true", bg: a.backgroundColor}; }));
        ok(seg.length && seg.every(s => s.hit >= 40 && s.seen >= 33 && s.seen <= 35) && seg.filter(s => s.on).every(s => !/rgba\(0, 0, 0, 0\)/.test(s.bg)), `12 (${tag}): segmented switches show a raised 34px segment with a 40px tap area: ` + JSON.stringify(seg));
        ok(await p.evaluate(() => { const d = document.querySelector(".cf-pick .dot-all"); return !!d && d.getBoundingClientRect().width > 0 && /conic-gradient/.test(getComputedStyle(d).backgroundImage); }), `12 (${tag}): All Courses shows a dot in every course colour`);
        await p.evaluate(() => document.querySelector("[data-act=menu]").click()); await wait(700);
        const st = await p.evaluate(() => { const c = document.querySelector("#dlg .us-cats"), cats = [...c.querySelectorAll(".us-cat")], ic = cats[0].querySelector(".us-ic").getBoundingClientRect(), sh = document.querySelector("#dlg .us-sheet"); return {radius: parseFloat(getComputedStyle(c).borderTopLeftRadius), borders: cats.map(b => getComputedStyle(b).borderTopWidth), ic: [ic.width, ic.height], icR: parseFloat(getComputedStyle(cats[0].querySelector(".us-ic")).borderTopLeftRadius), grab: getComputedStyle(sh, "::before").content, h2: parseFloat(getComputedStyle(document.querySelector("#dlg .sheet-head h2")).fontSize), search: getComputedStyle(document.querySelector("#dlg .us-search")).borderTopWidth, n: cats.length}; });
        ok(st.n >= 6 && st.radius >= 16 && st.borders.every(b => b === "0px") && st.ic[0] === 34 && st.icR < 17 && st.grab !== "none" && st.h2 >= 24 && st.search === "0px", `09 (${tag}): Settings is one rounded group with 34px rounded-square icons, a grab handle, a large title and a filled search: ` + JSON.stringify(st));
        await p.click('#dlg .us-cat[data-us="appearance"]'); await wait(300);
        const pane = await p.evaluate(() => { const l = document.querySelector("#usPane-appearance .menu-list.on, #usPane-appearance .menu-list"), rows = [...l.children].filter(r => r.offsetHeight); return {group: parseFloat(getComputedStyle(l).borderTopLeftRadius), rowBorders: rows.map(r => getComputedStyle(r).borderTopWidth), lines: rows.slice(1).every(r => /inset/.test(getComputedStyle(r).boxShadow))}; });
        ok(pane.group >= 16 && pane.rowBorders.every(b => b === "0px") && pane.lines, `09 (${tag}): a category's rows sit in one group with hairlines between them: ` + JSON.stringify(pane));
        ok(await p.evaluate(() => !!document.querySelector("#usPane-appearance .us-subs")), `09 (${tag}): the section switch inside a category stays`);
        await p.click("#dlg .us-back"); await wait(200);
        const g = await box(p, "#dlg .us-sheet .sheet-head h2");
        await p.mouse.move(g.x + 2, g.y + 4); await p.mouse.down(); await p.mouse.move(g.x + 2, g.y + 70, {steps: 5}); await p.mouse.move(g.x + 2, g.y + 160, {steps: 5}); await p.mouse.up(); await wait(300);
        ok(await p.evaluate(() => !document.getElementById("dlg").open), `09 (${tag}): pulling the sheet down by its top bar closes it`);
        await noOverflow(p, `09-12 (${tag})`);
        ok(!p.errs.length, `09-12 (${tag}): no page errors: ` + p.errs.join(" | "));
        await ctx.close();
      }
      /* 10 drawn empty states */
      {
        const {ctx, p} = await open(browser, {dark, empty: true});
        const art = () => p.evaluate(() => { const a = document.querySelector("#view .sb-es .es-art"); if (!a) return null; const r = a.getBoundingClientRect(), es = a.closest(".sb-es"), prim = es.querySelectorAll(".btn.primary"); return {w: Math.round(r.width), h: Math.round(r.height), title: (es.querySelector("strong") || {}).textContent, primary: prim.length, fill: getComputedStyle(a.querySelector(".es-card")).fill}; });
        const pages = [["groups", null, "Study Better Together"], ["notes", null, "Your Board Is Empty"], ["flashcards", null, "No Decks Yet"], ["courses", null, "No Courses Yet"], ["courses", "Files", "No Files Here Yet"], ["board", "Task Board", "Let's Set Up Your Term"]];
        for (const [t, sub, title] of pages) {
          await tab(p, t);
          if (sub) { await p.evaluate(s => { const b = [...document.querySelectorAll("#view button")].find(b => b.textContent.trim() === s); if (b) b.click(); }, sub); await wait(400); }
          const a = await art();
          ok(a && a.w === (t === "notes" ? 150 : 200) && a.title === title && (t === "notes" || a.primary === 1) && a.fill !== "none", `10 (${tag}): ${title} has the drawing, a friendly title and one primary button: ` + JSON.stringify(a));
        }
        await tab(p, "groups");
        ok(await p.evaluate(() => { const f = document.querySelector("#view .grp-file"); return parseFloat(getComputedStyle(f).borderTopLeftRadius) >= 16 && getComputedStyle(f).borderTopWidth === "1px" && !!f.querySelector('[data-act="grp-import"]'); }), `10 (${tag}): Share Without an Account is a tidy card that keeps its buttons`);
        await noOverflow(p, `10 (${tag})`);
        ok(!p.errs.length, `10 (${tag}): no page errors: ` + p.errs.join(" | "));
        await ctx.close();
      }
      /* 15 first-run welcome */
      {
        const {ctx, p} = await open(browser, {dark, fresh: true});
        await p.waitForSelector("dialog[open] #sbSignUp", {timeout: 20000});
        const w = await p.evaluate(() => { const d = document.querySelector("dialog[open] .sb-welc"); return {h: d.querySelector("h3").textContent, li: d.querySelectorAll("li").length, mochi: !!d.querySelector(".sb-welc-m svg"), alt: (d.querySelector('[data-sbm="signin"]') || {}).textContent, go: d.querySelector("#sbSignUp").getBoundingClientRect().height, email: !!document.querySelector("dialog[open] input[name=email]")}; });
        ok(/Hi! I'm Mochi\.\s*Let's plan your semester\./.test(w.h) && w.li === 3 && w.mochi && w.alt === "I Already Have an Account" && w.go >= 48 && !w.email, `15 (${tag}): a first-time student sees Mochi, three points, Sign Up and I Already Have an Account: ` + JSON.stringify(w));
        await noOverflow(p, `15 (${tag})`);
        await p.click("dialog[open] #sbSignUp");
        await p.waitForSelector("dialog[open] form.sb-acct[data-mode=signup] input[name=email]", {timeout: 8000});
        ok(!(await p.locator("dialog[open] #sbLater").count()), `15 (${tag}): Sign Up opens the sign-up form, with no Use Without an Account link`);
        await p.click('dialog[open] .sheet-head [data-act="close"]');
        await p.waitForSelector(".sheet.ob", {timeout: 8000});
        ok(await p.evaluate(() => localStorage.getItem("studioso:sb") === '"local"' && !!localStorage.getItem("studioso:welcomed") && SBGUEST.is()), `15 (${tag}): closing it works on this device and starts the welcome setup`);
        ok(!p.errs.length, `15 (${tag}): no page errors: ` + p.errs.join(" | "));
        await ctx.close();
      }
    }
    /* reduced motion: no pop */
    {
      const {ctx, p} = await open(browser, {reduce: true});
      await p.click('.plan-row .check[data-id="t2"], .check[data-id="t2"]');
      ok(await p.evaluate(() => !document.querySelector(".check.sb-pop")), "06: with reduced motion the check doesn't pop");
      await ctx.close();
    }
    /* 15 on a computer, and I Already Have an Account */
    {
      const {ctx, p} = await open(browser, {w: 1280, fresh: true});
      await p.waitForSelector("dialog[open] #sbSignUp", {timeout: 20000});
      const d = await box(p, "dialog[open] .sb-acct");
      const mid = await p.evaluate(() => document.documentElement.clientWidth / 2);
      ok(d && Math.abs(d.x + d.w / 2 - mid) <= 10 && d.w < 700, "15 (1280): the welcome is a centred card: " + JSON.stringify(d));
      await p.click('dialog[open] .sb-welc [data-sbm="signin"]');
      await p.waitForSelector("dialog[open] form.sb-acct[data-mode=signin] input[name=email]");
      ok(await p.locator("dialog[open] #sbLater").count() === 0 && await p.locator('dialog[open] [data-sbm="signup"]').count() === 1, "15 (1280): I Already Have an Account opens the sign-in sheet");
      ok(!p.errs.length, "15 (1280): no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    /* computers keep their look */
    {
      const {ctx, p} = await open(browser, {w: 1280});
      await tab(p, "courses");
      ok(await p.evaluate(() => { const c = document.querySelector("#view .c2-card"), v = s => c.querySelector(s).getBoundingClientRect().height > 0; return v(".body > .prog") && !v(".c2-mini") && !v(".c2-code") && c.querySelector(".c2-band").getBoundingClientRect().height > 40; }), "08 (1280): course cards keep their band and progress bar");
      await p.click('.check[data-id="t2"]').catch(() => {}); await wait(600);
      ok(await p.evaluate(() => { const t = document.getElementById("toast"); return !t.classList.contains("show") || t.getBoundingClientRect().width < 700; }), "06 (1280): the toast keeps its size on a computer");
      await noOverflow(p, "1280");
      ok(!p.errs.length, "1280: no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    {
      const {ctx, p} = await open(browser, {w: 1280, empty: true});
      await tab(p, "courses");
      ok(await p.evaluate(() => { const a = document.querySelector("#view .es-art"); return !!a && a.getBoundingClientRect().height === 0; }), "10 (1280): empty pages look as before on a computer");
      await ctx.close();
    }
  } catch (e) { console.error(e); process.exitCode = 1; }
  await browser.close(); server.close();
  console.log(`design-phone.e2e: ${checks} checks ${process.exitCode ? "FAILED" : "passed"}`);
})();
