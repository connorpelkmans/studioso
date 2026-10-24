// node tests/qol-social.e2e.js (Playwright + Chromium) Focus timer, streak, Style Shop, companion, search and Study Groups fixes
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {stubInit} = require("./group-stub");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(root, "tests-out");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const SEED = () => ({v: 2, updated: 1, settings: {capacity: 15}, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#1E9E74"}, {id: "c2", name: "History", code: "HIST 110", color: "#3B6FE0"}],
  tasks: [["t1", "Write the essay"], ["t2", "Read chapter 4"], ["t3", "Lab report"]].map(([id, title], i) => ({id, title, courseId: "c1", type: "Assignment", due: addD(3 + i), start: addD(0), hours: 2, status: "todo", priority: "med", created: Date.now() - 864e5, history: []}))});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); console.log("ok -", m); };

let base = "", browser = null;
async function page0(o = {}){
  const w = o.w || 1280, ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}, colorScheme: o.dark ? "dark" : "light", serviceWorkers: "block"});
  await ctx.addInitScript(([seed, o]) => {
    window.__SB_TEST = true;
    try {
      if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
      if (seed) localStorage.setItem("coursework:v2", JSON.stringify(seed));
      if (!o.fresh) { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:tour", "done"); }
      localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local"));
      if (o.free) localStorage.setItem("studyboard:paywall-test", "1");
    } catch (e) {}
  }, [o.fresh ? null : SEED(), {fresh: !!o.fresh, free: !!o.free}]);
  if (o.stub) await ctx.addInitScript(stubInit, o.stub);
  const page = await ctx.newPage(); page.errs = [];
  page.on("pageerror", e => page.errs.push(e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) page.errs.push(c.text().slice(0, 200)); });
  await page.goto(base); await page.waitForSelector("#view"); await page.waitForTimeout(1300);
  page.ctx = ctx;
  return page;
}
const act = (page, a, id, extra) => page.evaluate(([a, id, extra]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, extra || {}); b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]).then(() => page.waitForTimeout(300));
const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, " ").trim() : ""; }, sel);
const shown = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight); }, sel);
const noOverflow = async (page, what) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal scroll: " + what);
const tooSmall = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent && e.getBoundingClientRect().height < 39.5).map(e => (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24)), sel);
const shot = (page, name) => page.screenshot({path: path.join(SHOTS, `qol-${name}.png`)});
const done = async (page, what) => { eq(page.errs, [], "no page errors: " + what); await page.ctx.close(); };

/* Focus timer */
const today = () => iso(new Date());
const fmin = page => page.evaluate(d => Number((window.__sbBreakdown.state().settings.focusDays || {})[d]) || 0, today());
async function focusTimer(w, dark){
  const tag = `${w}px${dark ? " dark" : ""}:`, page = await page0({w, dark});
  const P = fn => page.evaluate(fn);
  await page.evaluate(() => document.querySelector("#pomoBtn").click()); await page.waitForSelector("#pomoDlg[open]");
  ok(await P(() => document.activeElement && document.activeElement.matches("#pomoDlg .pomo-ctl .btn.primary") && /Start/.test(document.activeElement.textContent)), tag + " the timer opens with Start focused, not Close");
  await P(() => { const T = window.__sbPomo, p = T.pomo; p.mode = "focus"; p.taskId = "t1"; p.preset = 0; p.running = true; p.endAt = Date.now() + 15 * 60000; T.save(); T.render(); });
  await page.click('#pomoDlg [data-act="pomo-mode"][data-id="short"]'); await page.waitForSelector("#askDlg[open]");
  ok(/focused for 10m/.test(await txt(page, "#askDlg")), tag + " Short Break mid-session asks first: " + await txt(page, "#askDlg"));
  await shot(page, `focus-ask-${w}${dark ? "-dark" : ""}`);
  await page.click("#askNo"); await page.waitForTimeout(200);
  ok(await P(() => window.__sbPomo.pomo.mode === "focus" && window.__sbPomo.pomo.running), tag + " Keep Focusing leaves the session running");
  ok(await fmin(page) === 0, tag + " and nothing is logged yet");
  await page.click('#pomoDlg [data-act="pomo-mode"][data-id="focus"]'); await page.waitForTimeout(150);
  ok(await P(() => window.__sbPomo.pomo.mode === "focus" && window.__sbPomo.pomo.running) && !(await shown(page, "#askDlg[open]")), tag + " tapping Focus during a focus session doesn't reset it");
  await page.click('#pomoDlg [data-act="pomo-mode"][data-id="short"]'); await page.waitForSelector("#askDlg[open]"); await page.click("#askYes"); await page.waitForTimeout(300);
  ok(await P(() => window.__sbPomo.pomo.mode === "short" && window.__sbPomo.pomo.running), tag + " confirming starts the break");
  ok(await fmin(page) === 10, tag + " and the 10 minutes are kept");
  ok(/Today: 0 focus sessions, 10m focused/.test(await txt(page, "#pomoDlg .pomo-today")), tag + " Today line: " + await txt(page, "#pomoDlg .pomo-today"));

  // A finished session with a task
  const finish = (tid, auto) => page.evaluate(([tid, auto]) => { const st = window.__sbBreakdown.state(), T = window.__sbPomo, p = T.pomo; st.settings = Object.assign({}, st.settings, {pomo: Object.assign({}, st.settings.pomo, {autoBreak: auto})}); p.mode = "focus"; p.taskId = tid; p.preset = 25; p.running = true; p.endAt = Date.now() - 5; T.save(); T.finish(); }, [tid, auto]).then(() => page.waitForSelector("#alarmDlg[open]"));
  await P(() => document.querySelector("#pomoDlg").close());
  await finish("t1", true);
  ok(/Mark “Write the essay” Done/.test(await txt(page, "#alDone")) && await shown(page, "#alAgain") && await shown(page, "#alSkip"), tag + " the alarm offers Mark Done, Another Session on It and Skip Break: " + await txt(page, "#alarmDlg"));
  ok((await tooSmall(page, "#alarmDlg .btn")).length === 0, tag + " alarm buttons are at least 40px tall");
  ok(await P(() => [...document.querySelectorAll("#alarmDlg .btn")].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })), tag + " alarm buttons fit the screen");
  await shot(page, `focus-alarm-${w}${dark ? "-dark" : ""}`);
  await page.click("#alSkip"); await page.waitForSelector("#pomoDlg[open]");
  ok(await P(() => window.__sbPomo.pomo.mode === "focus" && !window.__sbPomo.pomo.running && !document.querySelector("#alarmDlg").open), tag + " Skip Break ends the break and opens the timer ready to focus");
  ok(/Today: 1 focus session, 35m focused/.test(await txt(page, "#pomoDlg .pomo-today")), tag + " exact minutes (25 + 10 = 35m, not rounded to 30m): " + await txt(page, "#pomoDlg .pomo-today"));
  await page.evaluate(d => { const st = window.__sbBreakdown.state(); st.settings = Object.assign({}, st.settings, {focusSess: {[d]: 3}, focusDays: {[d]: 95}}); window.__sbPomo.render(); }, today());
  ok(/Today: 3 focus sessions, 1h 35m focused/.test(await txt(page, "#pomoDlg .pomo-today")), tag + " Today comes from the synced stats, so other devices count: " + await txt(page, "#pomoDlg .pomo-today"));
  await P(() => document.querySelector("#pomoDlg").close());

  await finish("t2", false);
  ok(!(await shown(page, "#alSkip")) && await shown(page, "#alStart") && await shown(page, "#alAgain"), tag + " without automatic breaks: Start Break, plus Another Session on It");
  await page.click("#alAgain"); await page.waitForTimeout(300);
  ok(await P(() => { const p = window.__sbPomo.pomo; return p.mode === "focus" && p.running && p.taskId === "t2"; }), tag + " Another Session on It starts a new focus session on the same task");
  await P(() => { const p = window.__sbPomo.pomo; p.running = false; p.left = 0; window.__sbPomo.save(); });
  await finish("t1", true);
  await page.click("#alDone"); await page.waitForTimeout(400);
  ok(await P(() => window.__sbBreakdown.state().tasks.t1.status === "done" && window.__sbPomo.pomo.taskId === ""), tag + " Mark Done finishes the task and clears it from the timer");
  await noOverflow(page, tag + " focus");
  await done(page, tag + " focus");
}

/* Gentle streak for new accounts, and the streak companion props follow */
async function streaks(){
  let page = await page0({fresh: true});
  await page.waitForTimeout(1500);
  ok(await page.evaluate(() => { const g = window.__sbBreakdown.state().settings.gentle; return !!(g && g.on) && SBSTREAK.on(); }), "a brand new account starts with the gentle streak");
  await done(page, "new account");
  page = await page0();
  ok(await page.evaluate(() => !SBSTREAK.on()), "an existing account keeps its choice (off unless turned on)");
  await page.evaluate(d => { const st = window.__sbBreakdown.state(); st.settings = Object.assign({}, st.settings, {streak: {cur: 9, best: 9, last: d}}); SBSTREAK.enable(); }, today());
  await page.waitForTimeout(4200);
  const ward = await page.evaluate(() => { const b = document.createElement("div"); b.innerHTML = SBCOMP.wardrobe(); return b.textContent.replace(/\s+/g, " "); });
  ok(/Hero Cape.*?0 of 7 day streak/.test(ward), "with the gentle streak on, prop progress uses it, not the hidden fire streak of 9: " + (ward.match(/Hero Cape.{0,160}/) || [""])[0]);
  await done(page, "streaks");
}

/* Style Shop search, free sections first, companion tiles, How to Earn More */
async function shop(w, dark){
  const tag = `${w}px${dark ? " dark" : ""}:`, page = await page0({w, dark, free: true});
  await act(page, "shop"); await page.waitForSelector("#dlg[open] .ui-shop #shopQ"); await page.waitForTimeout(500);
  const order = await page.$$eval("#dlg .sheet-body > .ui-sec", s => s.map(x => x.dataset.f));
  ok(order[0] === "free" && order[1] === "photos", tag + " a free account sees Free themes first, then the Pro photo section: " + order.slice(0, 3).join(","));
  const q = async v => { await page.fill("#shopQ", v); await page.waitForTimeout(250); return page.$$eval("#dlg .sheet-body .shop-tile:not(.ui-nomatch), #dlg .sheet-body .shop-pack:not(.ui-nomatch)", ts => ts.filter(t => t.offsetParent).map(t => (t.querySelector(".shop-name b") || t).textContent.trim())); };
  let hit = await q("ocean");
  ok(hit.some(x => /ocean/i.test(x)), tag + " searching themes finds Ocean: " + hit.slice(0, 4).join(", "));
  ok(hit.length < 20, tag + " and hides the rest: " + hit.length);
  await shot(page, `shop-search-${w}${dark ? "-dark" : ""}`);
  hit = await q("zzzzq");
  ok(hit.length === 0 && /Nothing matches/.test(await txt(page, "#dlg .ui-none")), tag + " no match says so");
  await page.click('#dlg [data-act="shop-tab"][data-id="stickers"]'); await page.waitForSelector("#dlg .ui-shop #shopQ"); await page.waitForTimeout(400);
  ok(await page.inputValue("#shopQ") === "zzzzq", tag + " the search carries across tabs");
  hit = await q("cat");
  ok(hit.length >= 1, tag + " sticker search finds packs with a cat: " + hit.join(", "));
  await page.click('#dlg [data-act="shop-tab"][data-id="cards"]'); await page.waitForTimeout(400);
  hit = await q("");
  ok(hit.length > 3, tag + " clearing shows everything again");
  ok(await page.evaluate(() => { const r = document.querySelector("#shopQ").getBoundingClientRect(); return r.height >= 39.5 && r.right <= innerWidth; }), tag + " the search field is big enough and fits");
  await noOverflow(page, tag + " shop");
  await page.keyboard.press("Escape");

  await page.evaluate(() => SBCOMP.open()); await page.waitForSelector("dialog[open] .cp-tile");
  const tile = await page.evaluate(() => { const t = document.querySelector('dialog[open] .cp-tile[data-id="plain-hilo"]'); return t ? {bar: !!t.querySelector(".cp-earn-bar[role=progressbar]"), free: !!t.querySelector(".free-badge"), lock: /🔒/.test(t.textContent), pro: (t.querySelector(".cp-earn-pro") || {}).textContent || "", btn: !!t.querySelector(".btn[data-act=comp-pick]")} : null; });
  ok(tile && tile.bar && !tile.free && !tile.lock && !tile.btn && /Or Get It With Pro/.test(tile.pro), tag + " an earnable companion shows one message with progress, and Pro as a link: " + JSON.stringify(tile));
  await shot(page, `comp-tiles-${w}${dark ? "-dark" : ""}`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  await page.evaluate(() => { const b = document.querySelector('[data-tab="companion"]'); if (b) b.click(); }); await page.waitForTimeout(400);
  await act(page, "cpt-tab", "wardrobe");
  if (await page.$(".cpt3-how > summary")) {
    const chev = await page.$eval(".cpt3-how > summary", s => getComputedStyle(s, "::after").borderRightStyle);
    ok(chev === "solid", tag + " How to Earn More has a disclosure chevron");
  }
  await done(page, tag + " shop");
}

/* Ask With AI has one course picker */
async function search(){
  const page = await page0();
  await act(page, "search"); await page.waitForSelector("#sxDlg[open]");
  ok(await shown(page, "#sxCourse"), "Search mode keeps the course dropdown");
  await page.click('#sxDlg [data-sx="mode"][data-id="ask"]'); await page.waitForSelector("#sxDlg.is-ask");
  ok(!(await shown(page, "#sxCourse")) && await shown(page, "#sxDlg .sx-scope [data-sx=scope]"), "Ask With AI shows only the course chips");
  ok((await page.$$eval("#sxDlg .sx-scope [data-sx=scope]", b => b.map(x => x.textContent.trim()))).join() === "All Courses,BIOL 201,HIST 110", "every course is a chip");
  await done(page, "search");
}

/* Group projects: board, claiming, filters, tabs, chat hint, invite wording */
async function project(w, dark){
  const tag = `project ${w}px${dark ? " dark" : ""}:`, page = await page0({w, dark, stub: {me: "u1", seed: true, kind: "project"}});
  await act(page, "grp-page"); await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]');
  await page.waitForSelector("#grpDetail #grpOverview .gk-hero", {timeout: 6000}); await page.waitForTimeout(900);
  const tabs = await page.$$eval("#grpDetail .grp-tabs [role=tab]", bs => bs.map(b => ({t: b.dataset.t, sel: b.getAttribute("aria-selected"), ti: b.tabIndex, pane: (document.getElementById(b.getAttribute("aria-controls")) || {}).getAttribute ? document.getElementById(b.getAttribute("aria-controls")).getAttribute("role") : "", r: b.getBoundingClientRect().right})));
  ok(tabs.length >= 5 && tabs.every(x => x.pane === "tabpanel"), tag + " every tab controls a tabpanel");
  ok(tabs.filter(x => x.ti === 0).length === 1 && tabs[0].sel === "true", tag + " one tab is in the tab order");
  ok(await page.evaluate(() => { const b = document.querySelector("#grpDetail .grp-tabs"); return b.scrollWidth <= b.clientWidth + 1 && [...b.children].every(c => c.getBoundingClientRect().right <= innerWidth); }), tag + " every section tab is visible, none hidden off the edge");
  ok((await tooSmall(page, "#grpDetail .grp-tabs [role=tab]")).length === 0, tag + " tabs are at least 40px tall");
  await page.focus('#grpDetail .grp-tabs [role=tab][aria-selected="true"]'); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(150);
  const after = await page.evaluate(() => ({focus: document.activeElement.dataset.t, sel: document.querySelector('#grpDetail .grp-tabs [aria-selected="true"]').dataset.t, pane: [...document.querySelectorAll("#grpDetail .grp-pane")].filter(p => !p.hidden).map(p => p.dataset.pane)}));
  ok(after.focus === tabs[1].t && after.sel === tabs[1].t && after.pane.join() === tabs[1].t, tag + " the arrow keys move between tabs: " + JSON.stringify(after));
  await page.keyboard.press("End"); await page.waitForTimeout(100);
  const endT = await page.evaluate(() => [document.activeElement.tagName, document.activeElement.dataset.t, document.querySelector('#grpDetail .grp-tabs [aria-selected="true"]').dataset.t].join());
  ok(endT === ["BUTTON", tabs[tabs.length - 1].t, tabs[tabs.length - 1].t].join(), tag + " End goes to the last tab: " + endT);
  await page.keyboard.press("Home"); await page.waitForTimeout(100);
  await shot(page, `proj-overview-${w}${dark ? "-dark" : ""}`);

  ok(/nobody has claimed/.test(await txt(page, "#grpOverview")), tag + " Overview says a task is unclaimed");
  await page.click('#grpOverview [data-act="grp-pt-claim-one"]'); await page.waitForSelector("#dlg[open] input[name=title]");
  ok(await page.inputValue('#dlg input[name="title"]') === "Proofread" && await page.evaluate(() => document.querySelector('#grpDetail .grp-tabs [aria-selected="true"]').dataset.t) === "tasks", tag + " Claim one opens the first unclaimed task, on Tasks");
  await page.click('#dlg [data-act="grp-pt-claim-sheet"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s4").assignee_id) === "u1", tag + " Claim This in the sheet assigns it to me");

  await page.evaluate(() => { const D = window.__DB; D.group_tasks.push(Object.assign({}, D.group_tasks[3], {id: "s6", title: "Print handouts", assignee_id: null, position: 9, status: "todo"})); window.__fire("group_tasks", "INSERT"); });
  await page.waitForSelector('#grpPT .kb-card[data-id="s6"] [data-act="grp-pt-claim"]', {timeout: 4000});
  ok(await page.$$eval("#grpPT .kb-card .pt-check[role=checkbox]", e => e.length) >= 6, tag + " every board card has a checkbox");
  await page.click('#grpPT .kb-card[data-id="s6"] [data-act="grp-pt-claim"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s6").assignee_id) === "u1", tag + " Claim This on a board card");
  await page.click('#grpPT .kb-card[data-id="s3"] [data-act="grp-pt-done"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s3").status) === "done", tag + " ticking a board card finishes the task");
  ok(await page.$eval('#grpPT .kb-col.k-done .kb-card[data-id="s3"] .pt-check', b => b.getAttribute("aria-checked")) === "true", tag + " and it moves to Done, ticked");
  ok(await shown(page, "#toastUndo") && /Done: Design the poster layout/.test(await txt(page, "#toastMsg")), tag + " with an Undo");
  await page.click("#toastUndo"); await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s3").status) === "todo", tag + " Undo puts it back");
  await page.click('#grpPT [data-act="grp-pt-bfilter"][data-f="mine"]'); await page.waitForTimeout(250);
  const mine = (await page.$$eval("#grpPT .kb-card .pt-title", e => e.map(x => x.textContent.trim()))).sort();
  eq(mine, ["Collect survey data", "Print handouts", "Proofread", "Write the methods section"], tag + " Mine shows only my tasks");
  await page.click('#grpPT [data-act="grp-pt-bfilter"][data-f="all"]'); await page.waitForTimeout(250);
  ok((await tooSmall(page, "#grpPT .pt-check, #grpPT .kb-claim, #grpPT .pt-f")).length === 0, tag + " board controls are at least 40px");
  await noOverflow(page, tag + " board");
  await shot(page, `proj-board-${w}${dark ? "-dark" : ""}`);

  await page.click('#grpDetail [data-act="grp-tab"][data-t="chat"]'); await page.waitForTimeout(200);
  if (w > 600) ok(/(Ctrl|⌘)\+Enter to post/.test(await txt(page, "#grpPostHint")) && await page.getAttribute("#grpMsgIn", "aria-describedby") === "grpPostHint", tag + " chat says how to post from the keyboard");
  await act(page, "grp-invite", "g1"); await page.waitForSelector("#dlg[open] .grp-code-big");
  ok(/your teammates/.test(await txt(page, "#dlg")) && !/classmates/.test(await txt(page, "#dlg")), tag + " a project invite talks about teammates");
  await done(page, tag);
}

/* Study group sessions: Length, end time, your calendar, busy times, Your Free Times */
async function sessions(w, dark){
  const tag = `sessions ${w}px${dark ? " dark" : ""}:`, tom = addD(1), start = new Date(`${tom}T18:00`).toISOString();
  const page = await page0({w, dark, stub: {me: "u1", kind: "study", items: [{id: "e1", kind: "event", user_id: "u2", author_name: "Sam", title: "Midterm review", data: {v: 1, type: "event", start, mins: 90, where: "Library"}}]}});
  await act(page, "grp-page"); await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]');
  await page.waitForSelector("#grpDetail", {timeout: 6000}); await page.click('#grpDetail [data-act="grp-tab"][data-t="sessions"]');
  await page.waitForSelector('#grpSessions [data-act="grp-rsvp"][data-id="e1"]', {timeout: 6000});
  ok(/6:00\sPM to 7:30\sPM/.test(await txt(page, "#grpSessions")), tag + " a session shows its end time: " + await txt(page, "#grpSessions .grp-item .mini"));
  ok(await shown(page, '#grpSessions [data-act="grp-cal-add"][data-id="e1"]'), tag + " sessions you haven't joined offer Add to My Calendar");
  await page.click('#grpSessions [data-act="grp-rsvp"][data-id="e1"][data-s="yes"]'); await page.waitForTimeout(500);
  const copy = await page.evaluate(() => Object.values(window.__sbBreakdown.state().events).find(e => e.groupRef && e.groupRef.i === "e1"));
  ok(copy && copy.date === tom && copy.start === "18:00" && copy.end === "19:30" && copy.where === "Library", tag + " I'm In puts it on my calendar for its full length: " + JSON.stringify(copy && {d: copy.date, s: copy.start, e: copy.end}));
  ok(/on your calendar/i.test(await txt(page, "#toastMsg")), tag + " and says so");
  ok(/On your calendar/.test(await txt(page, "#grpSessions")) && !(await shown(page, '#grpSessions [data-act="grp-cal-add"][data-id="e1"]')), tag + " the session row says it's on your calendar");

  await act(page, "gx-ft-mine", "g1"); await page.waitForSelector("#dlg[open] #pfGrid");
  const g = await page.evaluate(() => { const c = k => { const b = document.querySelector(`#pfGrid [data-pf="${k}"]`); return b ? b.getAttribute("aria-pressed") : "?"; }; return {busy18: c("1:18"), busy19: c("1:19"), free15: c("1:15"), free20: c("1:20"), n: document.querySelectorAll('#pfGrid [aria-pressed="true"]').length, head: [...document.querySelectorAll("#pfGrid .ft-d")].map(d => d.textContent.trim()), h: document.querySelector('#pfGrid [data-pf="1:10"]').getBoundingClientRect().height}; });
  ok(g.n > 20 && g.free15 === "true" && g.free20 === "true", tag + " Your Free Times starts filled in from the planner: " + g.n + " hours");
  ok(g.busy18 === "false" && g.busy19 === "false", tag + " a joined session counts as busy for its whole length");
  ok(g.head.length === 7 && g.head.every(x => /\d/.test(x)), tag + " day headers show dates: " + g.head.slice(0, 2).join(" | "));
  ok(g.h >= (w < 600 ? 39.5 : 33.5), tag + " hour cells are big enough to tap: " + g.h);
  const box = k => page.$eval(`#pfGrid [data-pf="${k}"]`, b => { const r = b.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
  await page.$eval('#pfGrid [data-pf="1:12"]', b => b.scrollIntoView({block: "center"}));
  const a1 = await box("1:10"), a3 = await box("1:12");
  await page.mouse.move(a1.x, a1.y); await page.mouse.down(); await page.mouse.move(a1.x, (a1.y + a3.y) / 2, {steps: 4}); await page.mouse.move(a3.x, a3.y, {steps: 4}); await page.mouse.up(); await page.waitForTimeout(150);
  eq(await page.$$eval('#pfGrid [data-pf="1:10"], #pfGrid [data-pf="1:11"], #pfGrid [data-pf="1:12"]', b => b.map(x => x.getAttribute("aria-pressed"))), ["false", "false", "false"], tag + " dragging across hours paints them all");
  const c2 = await box("2:10"); await page.mouse.click(c2.x, c2.y); await page.waitForTimeout(100);
  ok(await page.getAttribute('#pfGrid [data-pf="2:10"]', "aria-pressed") === "false", tag + " a single tap still toggles one hour");
  await page.focus('#pfGrid [data-pf="2:10"]'); await page.keyboard.press("Enter"); await page.waitForTimeout(100);
  ok(await page.getAttribute('#pfGrid [data-pf="2:10"]', "aria-pressed") === "true", tag + " and the keyboard works too");
  await noOverflow(page, tag + " free times");
  await shot(page, `free-times-${w}${dark ? "-dark" : ""}`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);

  await page.click('#grpSessions [data-act="grp-rsvp"][data-id="e1"][data-s="no"]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => !Object.values(window.__sbBreakdown.state().events).some(e => e.groupRef && e.groupRef.i === "e1")), tag + " Can't takes it off my calendar again");

  await act(page, "grp-event-new", "g1"); await page.waitForSelector('#dlg[open] select[name="mins"]');
  ok(await page.$eval('#dlg select[name="mins"]', s => s.value) === "60" && /1 hour 30 min/.test(await txt(page, '#dlg select[name="mins"]')), tag + " a new session has a Length field");
  await page.fill('#dlg input[name="title"]', "Lab practice"); await page.fill('#dlg input[name="date"]', addD(2)); await page.fill('#dlg input[name="time"]', "10:00");
  await page.selectOption('#dlg select[name="mins"]', "45");
  await page.click("#dlg [data-submit]"); await page.waitForTimeout(800);
  const made = await page.evaluate(() => { const it = window.__DB.group_items.find(x => x.title === "Lab practice"), ev = it && Object.values(window.__sbBreakdown.state().events).find(e => e.groupRef && e.groupRef.i === it.id); return {mins: it && it.data.mins, end: ev && ev.end}; });
  ok(made.mins === 45 && made.end === "10:45", tag + " the Length is saved and used for the calendar copy: " + JSON.stringify(made));
  ok(/to 10:45/.test(await txt(page, "#grpSessions")), tag + " and its end time shows");
  await done(page, tag);
}

// New things from other members show as counts on the Groups icon, the group's card and the section tab
async function news(w){
  const tag = `group news ${w}px:`, at = "2026-03-01T00:00:00Z";
  const page = await page0({w, stub: {me: "u1", kind: "study",
    items: [{id: "d1", kind: "deck", user_id: "u2", author_name: "Sam", title: "Cell Bio", created_at: at, updated_at: at, data: {v: 1, name: "Cell Bio", cards: [{id: "a", front: "ATP", back: "Energy"}]}}],
    msgs: [{user_id: "u2", body: "Quiz on Friday?", created_at: "2026-03-02T00:00:00Z"}, {user_id: "u1", body: "Yes", created_at: "2026-03-03T00:00:00Z"}]}});
  await page.evaluate(() => localStorage.setItem("studyboard:grpSeen:u1", JSON.stringify({g1: {b: Date.parse("2026-02-01T00:00:00Z"), t: {}}})));
  await page.reload(); await page.waitForSelector("#view"); await page.waitForTimeout(1500);
  const nav = () => page.evaluate(() => { const d = document.querySelector('nav.tabs [data-tab="groups"] .grp-dot'); return d ? d.textContent : ""; });
  ok(await nav() === "2", tag + " the Groups icon counts the deck and the chat message from Sam, not your own message: " + await nav());
  await act(page, "grp-page"); await page.waitForSelector('[data-act="grp-open"]'); await page.waitForTimeout(300);
  ok(await txt(page, '[data-act="grp-open"] .grp-new') === "2", tag + " the group's card shows 2 new");
  await page.click('[data-act="grp-open"]'); await page.waitForSelector("#grpDetail .grp-tabs"); await page.waitForTimeout(400);
  const tabN = k => page.evaluate(k => { const b = document.querySelector(`#grpDetail .grp-tabs [data-t="${k}"] .grp-new`); return b ? b.textContent : ""; }, k);
  ok(await tabN("study") === "" && await tabN("chat") === "1", tag + " opening the group clears Study (where you land) and Chat shows 1");
  ok(await nav() === "1", tag + " the Groups icon drops to 1");
  await page.click('#grpDetail .grp-tabs [data-t="chat"]'); await page.waitForTimeout(300);
  ok(await tabN("chat") === "" && await nav() === "", tag + " opening Chat clears it everywhere");
  await page.reload(); await page.waitForSelector("#view"); await page.waitForTimeout(1500);
  ok(await nav() === "", tag + " and it stays cleared after a reload");
  await done(page, tag);
}

(async () => {
  await new Promise(r => server.listen(0, r)); base = "http://localhost:" + server.address().port + "/";
  browser = await chromium.launch({executablePath});
  try {
    await focusTimer(1280); await focusTimer(390, true);
    await streaks();
    await shop(1280); await shop(390, true);
    await search();
    await project(1280); await project(390, true);
    await sessions(1280); await sessions(390, true);
    await news(1280); await news(390);
    console.log(`\nqol-social.e2e.js: ${n} checks passed. Screenshots in ${SHOTS}`);
  } catch (e) { console.error("FAILED:", e.message); process.exitCode = 1; }
  await browser.close(); server.close();
})();
