// node tests/quickadd-repeat-pages.e2e.js [screenshot folder]
// Repeats and pages in the Board's add bar: "math homework every monday" makes a repeating series (not "Math Homework Every"),
// the toast says the rule in plain words with Edit and Undo (Undo takes the whole series away), "read chapter 4 pages 30 thursday"
// makes a reading with 30 pages shown as "30 pages · about 1h 30m", and the course page has one Reading Pace field that changes it.
// Runs on a phone (402x874) and a computer (1300x860), with today fixed at Thursday 26 November 2026.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || "";
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 10, 26, 10, 0, 0); // Thursday
const DONE_AT = new Date(2026, 10, 20, 18, 0, 0).getTime();
const SEED = {v: 2, updated: 1, settings: {},
  courses: [{id: "c1", name: "English Literature", code: "ENGL 210", color: "#3B6FE0"}, {id: "c2", name: "World History", code: "HIST 101", color: "#1E9E74"}],
  // a finished History reading: 20 pages in 80 minutes of focus (4 min a page)
  tasks: [{id: "h1", title: "Read Chapter 2", courseId: "c2", type: "Reading", due: "2026-11-20", status: "done", doneAt: DONE_AT, created: DONE_AT - 864e5, pages: 20, focusMin: 80, pomos: 3}]};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, h, mob] of [[402, 874, true], [1300, 860, false]]) {
      for (const scheme of SHOTS ? ["light", "dark"] : ["light"]) {
        const tag = `${mob ? "phone" : "desktop"}-${scheme}`;
        const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, colorScheme: scheme});
        await ctx.clock.install({time: NOW});
        await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
        await ctx.addInitScript(seed => {
          if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
          localStorage.setItem("coursework:v2", JSON.stringify(seed));
          localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
        }, SEED);
        const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
        const shot = async (name, sel) => { if (!SHOTS) return; await page.waitForTimeout(350); const p = path.join(SHOTS, `${name}-${tag}.png`); if (sel) await page.locator(sel).first().screenshot({path: p}); else await page.screenshot({path: p}); };
        const course = async id => { await page.evaluate(() => { const b = document.querySelector('[data-tab="courses"]'); if (b) b.click(); }); await page.waitForTimeout(300); await act("open-course", id); await page.waitForTimeout(600); };
        const act = (a, id) => page.evaluate(([a, i]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
        const tasks = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const t = s.tasks || {}; return Array.isArray(t) ? t : Object.values(t); });
        const toast = () => page.evaluate(() => { const t = document.getElementById("toastMsg"), u = document.getElementById("toastUndo"), x = document.getElementById("toastExtra"); return {msg: t ? t.textContent : "", undo: !!u && !u.hidden, extra: x && !x.hidden ? x.textContent : ""}; });
        await page.goto(base); await page.waitForSelector("#qaIn", {timeout: 40000}); await page.waitForTimeout(600);
        // the Board's add bar: type, press Enter, and on a phone confirm the check
        const add = async text => {
          await page.fill("#qaIn", text); await page.waitForTimeout(150);
          const live = await page.evaluate(() => (document.getElementById("qaLive") || {}).textContent || "");
          await page.press("#qaIn", "Enter"); await page.waitForTimeout(500);
          const pv = await page.$("#qaAddBtn");
          let meta = "", btn = "";
          if (pv) { btn = await pv.textContent(); meta = await page.evaluate(() => [...document.querySelectorAll(".qa-preview .qa-meta")].map(e => e.textContent).join(" | ")); if (SHOTS && /every/i.test(text)) await shot("1-check", ".qa-preview"); await pv.click(); await page.waitForTimeout(500); }
          return {live, meta, btn, previewed: !!pv};
        };

        // 1. "math homework every monday": a weekly series on Mondays, the repeat words out of the title
        const r1 = await add("math homework every monday");
        ok(/every Monday/.test(r1.live), `${tag}: the line under the bar says it repeats: ${r1.live}`);
        if (mob) ok(r1.previewed && /Every Monday until Dec 15/.test(r1.meta) && r1.btn === "Add Task", `${tag}: the phone's check shows the rule: ${r1.meta} / ${r1.btn}`);
        let T = (await tasks()).filter(t => t.id !== "h1");
        ok(T.length === 3 && T.every(t => t.title === "Math Homework"), `${tag}: three tasks titled "Math Homework" (not "Math Homework Every"): ` + T.map(t => t.title + " " + t.due).join(", "));
        ok(T.map(t => t.due).sort().join() === "2026-11-30,2026-12-07,2026-12-14", `${tag}: every Monday from Nov 30 to the end of term: ` + T.map(t => t.due).sort().join());
        ok(new Set(T.map(t => t.seriesId)).size === 1 && T[0].seriesId, `${tag}: one repeating series, like the New Task form's Repeat field makes`);
        let ts = await toast();
        ok(ts.msg === "Added Math Homework: every Monday until Dec 15 (3 tasks)" && ts.undo && ts.extra === "Edit", `${tag}: the toast says the rule in plain words, with Edit and Undo: ` + JSON.stringify(ts));
        await shot("2-toast-repeat");
        // Undo takes the whole series away
        await page.click("#toastUndo"); await page.waitForTimeout(500);
        ok((await tasks()).filter(t => t.id !== "h1").length === 0, `${tag}: Undo removes the whole series`);

        // 2. "reading weekdays until dec 12": Monday to Friday, today included, to Dec 12
        await add("reading weekdays until dec 12");
        T = (await tasks()).filter(t => t.id !== "h1");
        const want = ["2026-11-26", "2026-11-27", "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-07", "2026-12-08", "2026-12-09", "2026-12-10", "2026-12-11"];
        ok(T.map(t => t.due).sort().join() === want.join(), `${tag}: weekdays from today until Dec 12: ` + T.map(t => t.due).sort().join());
        ts = await toast();
        ok(ts.msg === "Added Reading: every weekday until Dec 12 (12 tasks)", `${tag}: toast: ${ts.msg}`);
        await page.click("#toastUndo"); await page.waitForTimeout(400);

        // 3. "lab report every other thu" and "quiz every 2 weeks fri"; "MWF" and "TTh"
        await add("lab report every other thu");
        T = (await tasks()).filter(t => t.id !== "h1");
        ok(T.map(t => t.due).sort().join() === "2026-11-26,2026-12-10" && T.every(t => t.title === "Lab Report"), `${tag}: every other Thursday: ` + T.map(t => t.title + " " + t.due).join(", "));
        await page.click("#toastUndo"); await page.waitForTimeout(400);
        await add("quiz every 2 weeks fri");
        T = (await tasks()).filter(t => t.id !== "h1");
        ok(T.map(t => t.due).sort().join() === "2026-11-27,2026-12-11" && T.every(t => t.type === "Quiz"), `${tag}: every 2 weeks on Friday: ` + T.map(t => t.title + " " + t.due).join(", "));
        await page.click("#toastUndo"); await page.waitForTimeout(400);
        await add("problem set MWF until dec 9");
        T = (await tasks()).filter(t => t.id !== "h1");
        ok(T.map(t => t.due).sort().join() === "2026-11-27,2026-11-30,2026-12-02,2026-12-04,2026-12-07,2026-12-09", `${tag}: MWF: ` + T.map(t => t.due).sort().join());
        await page.click("#toastUndo"); await page.waitForTimeout(400);

        // 4. "every" inside a title doesn't repeat
        await add("Everything Bagel essay fri");
        T = (await tasks()).filter(t => t.id !== "h1");
        ok(T.length === 1 && T[0].title === "Everything Bagel essay" && !T[0].seriesId && T[0].due === "2026-11-27", `${tag}: "Everything Bagel essay" is one task: ` + JSON.stringify(T.map(t => [t.title, t.due, t.seriesId])));
        await page.click("#toastUndo"); await page.waitForTimeout(400);

        // 5. a series on the Task Board (screenshot), then cleared
        await add("math homework every monday");
        await act("bview", "board"); await page.waitForTimeout(400);
        const cards = await page.$$eval(".card", cs => cs.filter(c => /Math Homework/.test(c.textContent)).map(c => [!!c.querySelector('[title="Repeats"], svg[aria-label="Repeats"]'), c.textContent.replace(/\s+/g, " ").trim().slice(0, 60)]));
        ok(cards.length === 3 && cards.every(c => c[0]), `${tag}: the Task Board shows the three cards, each marked as repeating: ` + JSON.stringify(cards));
        if (SHOTS) { await page.evaluate(() => { const t = document.getElementById("toast"); if (t) t.classList.remove("show"); }); await shot("3-board-series"); }
        await page.click("#toastUndo").catch(() => {}); await page.waitForTimeout(300);
        if ((await tasks()).filter(t => t.id !== "h1").length) { await page.evaluate(() => { document.dispatchEvent(new KeyboardEvent("keydown", {key: "z", ctrlKey: true, bubbles: true})); }); await page.waitForTimeout(300); }

        // 6. a reading with pages: "30 pages · about 1h 30m" at the default 3 min a page
        const r6 = await add("engl read chapter 4 pages 30 thursday");
        T = (await tasks()).filter(t => t.id !== "h1");
        ok(T.length === 1 && T[0].title === "Read Chapter 4" && T[0].pages === 30 && T[0].type === "Reading" && T[0].courseId === "c1" && T[0].due === "2026-12-03", `${tag}: "Read Chapter 4" with 30 pages: ` + JSON.stringify(T.map(t => [t.title, t.pages, t.type, t.due, t.hours])));
        ok(T[0].hours == null, `${tag}: no hours stored, so the time follows the reading pace`);
        ok(/30 pages · about 1h 30m/.test(r6.live), `${tag}: the line under the bar shows the pages and time: ${r6.live}`);
        const rid = T[0].id;
        const cardTxt = () => page.evaluate(id => { const c = document.querySelector(`.card[data-id="${id}"] .card-pages, [data-id="${id}"] .card-pages`); return c ? c.textContent : ""; }, rid);
        await page.waitForTimeout(400);
        ok(/30 pages · about 1h 30m/.test(await cardTxt()), `${tag}: the Board card shows "30 pages · about 1h 30m": ${await cardTxt()}`);
        if (SHOTS) { await page.evaluate(id => { const t = document.getElementById("toast"); if (t) t.classList.remove("show"); const c = document.querySelector(`.card[data-id="${id}"]`); if (c) c.scrollIntoView({block: "center"}); }, rid); await shot("4-reading-card"); }
        // its own page says the same, with the pace
        await act("edit-task", rid); await page.waitForTimeout(500);
        const tv = await page.evaluate(() => { const d = document.querySelector("dialog[open] .occv-rows"); return d ? d.textContent : ""; });
        ok(/30 pages · about 1h 30m/.test(tv) && /3 min a page/.test(tv), `${tag}: the task's page shows the pages, time and pace: ${tv.replace(/\s+/g, " ").slice(0, 160)}`);
        await shot("5-reading-view", "dialog[open] .sheet");
        await page.keyboard.press("Escape"); await page.waitForTimeout(300);
        await page.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); });

        // 7. the course page: one Reading Pace field; changing it changes the reading's time, and Undo puts it back
        await course("c1");
        const paceIn = await page.$("#cPace");
        ok(!!paceIn && (await paceIn.inputValue()) === "3", `${tag}: English Literature's page has "Reading pace: 3 min a page"`);
        await page.evaluate(() => { const e = document.querySelector(".c2-pace"); if (e) e.scrollIntoView({block: "center"}); });
        await shot("6-course-pace", ".c2-pace");
        await page.fill("#cPace", "4"); await page.press("#cPace", "Tab"); await page.waitForTimeout(500);
        ts = await toast();
        ok(ts.msg === "Reading pace: 4 min a page" && ts.undo, `${tag}: saving the pace says so, with Undo: ${ts.msg}`);
        const c1 = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const c = s.courses; return (Array.isArray(c) ? c : Object.values(c)).find(x => x.id === "c1"); });
        ok(c1.readPace === 4 && c1.readPaceAt > 0, `${tag}: the course keeps its pace: ${c1.readPace}`);
        await page.click("#toastUndo"); await page.waitForTimeout(400);
        const c1b = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const c = s.courses; return (Array.isArray(c) ? c : Object.values(c)).find(x => x.id === "c1"); });
        ok(!(c1b.readPace > 0) && (await page.inputValue("#cPace")) === "3", `${tag}: Undo puts the pace back to 3`);
        // back on the Board, the card follows the pace
        await page.fill("#cPace", "4"); await page.press("#cPace", "Tab"); await page.waitForTimeout(400);
        await page.evaluate(() => { const b = document.querySelector('[data-tab="board"]'); if (b) b.click(); }); await page.waitForTimeout(500);
        ok(/30 pages · about 2h/.test(await cardTxt()), `${tag}: at 4 min a page the card says "30 pages · about 2h": ${await cardTxt()}`);

        // 8. the History course learned 4 min a page from a finished reading: 3 moves 30% of the way, to 3.3
        await course("c2");
        ok((await page.inputValue("#cPace")) === "3.3", `${tag}: History's pace learned from its finished reading: ${await page.inputValue("#cPace")}`);
        ok(/Learned from 1 finished reading/.test(await page.textContent(".c2-pace")), `${tag}: and says what it learned from`);
        ok(!errs.length, `${tag}: no page errors: ` + errs.join(" | "));
        await ctx.close();
      }
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nquickadd-repeat-pages.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
