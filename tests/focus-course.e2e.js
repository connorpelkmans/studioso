// node tests/focus-course.e2e.js
// Focus: pick the course first, then one of its tasks or No particular task. A session for a course with no task counts for that
// course (Insights' focus log, so Study Days on its course page) and doesn't ask which task it was for
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), D = process.env.SHOT_DIR;
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": {".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json"}[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
const iso = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const SEED = {v: 2, updated: 1, settings: {}, files: [], notes: [], decks: [], courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}, {id: "c2", name: "English", code: "ENGL 1100", color: "#D9792B"}, {id: "c3", name: "History", code: "HIST 1250", color: "#C8382E"}],
  tasks: [{id: "t1", title: "Lab Report", courseId: "c1", due: iso(1), hours: 2, status: "todo"}, {id: "t2", title: "Essay Draft", courseId: "c2", due: iso(2), hours: 2, status: "todo"}, {id: "t3", title: "Read ch. 11", courseId: "c3", due: iso(0), hours: 1, status: "todo"}, {id: "t4", title: "Read ch. 15", courseId: "c1", due: iso(3), hours: 1, status: "todo"}]};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const b = await chromium.launch({executablePath});
  for (const [w, h, mob] of [[402, 874, true], [1300, 900, false]]) {
    const ctx = await b.newContext({viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, serviceWorkers: "block", deviceScaleFactor: 2});
    await ctx.addInitScript(s => { window.__SB_TEST = true; if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } }, SEED);
    const p = await ctx.newPage(); await p.clock.install(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(base); await p.waitForFunction(() => window.__sbSync); await p.waitForTimeout(1000);
    await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pomo-open"; document.body.appendChild(b); b.click(); b.remove(); });
    await p.waitForSelector("#pomoDlg[open] #pomoCourse");
    const opts = () => p.evaluate(() => ({course: document.getElementById("pomoCourse").value, task: document.getElementById("pomoTask").value, tasks: [...document.querySelectorAll("#pomoTask option")].map(o => o.textContent)}));
    var o = await opts();
    ok(o.course === "" && o.tasks[0] === "No particular task" && o.tasks.length === 5, `${w}px: no course picked: every task, No particular task first: ` + JSON.stringify(o));
    await p.selectOption("#pomoCourse", "c1"); await p.waitForTimeout(200);
    o = await opts();
    ok(o.course === "c1" && JSON.stringify(o.tasks) === JSON.stringify(["No particular task", "Lab Report", "Read ch. 15"]), `${w}px: Biology picked: only its tasks, after No particular task: ` + JSON.stringify(o));
    if (D) await p.screenshot({path: `${D}/focus-${w}.png`, clip: await p.evaluate(() => { const r = document.querySelector(".pomo-for").getBoundingClientRect(); return {x: Math.max(0, r.left - 20), y: Math.max(0, r.top - 20), width: Math.min(innerWidth, r.width + 40), height: r.height + 40}; })});
    // a session with the course and no task: the time counts for Biology, and nothing asks which task it was for
    await p.click('#pomoDlg [data-act="pomo-start"]');
    await p.clock.fastForward("26:00"); await p.waitForTimeout(800);
    const st = await p.evaluate(() => { const S = window.__sbSync.state.settings || {}; const chip = document.getElementById("accChip"); return {log: (S.focusLog || []).slice(-1)[0], days: S.focusDays, which: !!chip && !chip.hidden && chip.dataset.kind === "which", heat: typeof SBHEAT !== "undefined" && SBHEAT.data ? null : null}; });
    ok(st.log && st.log.c === "c1" && st.log.m >= 25 && !st.log.t, `${w}px: the focus log has the session for Biology, with no task: ` + JSON.stringify(st.log));
    ok(!st.which, `${w}px: it doesn't ask "Which task was that for?"`);
    // a task picked first: the course follows it; then another course lets the task go
    await p.keyboard.press("Escape").catch(() => {});
    await p.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.createElement("button"); b.dataset.act = "pomo-open"; document.body.appendChild(b); b.click(); b.remove(); });
    await p.waitForSelector("#pomoDlg[open] #pomoCourse");
    await p.selectOption("#pomoCourse", ""); await p.waitForTimeout(150);
    await p.selectOption("#pomoTask", "t2"); await p.waitForTimeout(150);
    o = await opts();
    ok(o.course === "c2" && o.task === "t2", `${w}px: picking Essay Draft picks English too: ` + JSON.stringify({course: o.course, task: o.task}));
    await p.selectOption("#pomoCourse", "c3"); await p.waitForTimeout(150);
    o = await opts();
    ok(o.course === "c3" && o.task === "", `${w}px: switching to History lets the English task go: ` + JSON.stringify({course: o.course, task: o.task}));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close();
  }
  await b.close(); server.close(); console.log(`\nfocus-course.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
