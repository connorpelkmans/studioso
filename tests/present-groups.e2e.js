// node tests/present-groups.e2e.js: presentation practice with a group project. Two members (two browsers) share one group,
// stood in for here by a small in-memory server (group_items with kinds pres, presrun and preslive). Maya links a presentation to
// a task, shares it with the group (speakers from the members; a free group, so no slides upload), practises her part; Sam adds
// his own copy and gets the plan and speakers, sees Maya's progress; Maya leads a live rehearsal over the real encrypted channel,
// Sam joins and moves the slides from his device, and both get the run; Today's Plan and the task sheet offer the practice.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const FX = path.join(__dirname, "fixtures"), OUT = require("os").tmpdir() + "/sbpgroup";
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
const iso = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const SEED = {v: 2, updated: 1, tasks: [{id: "t1", title: "Final Presentation", courseId: "c1", due: iso(2), status: "todo", est: 2, created: 1}], files: [], notes: [], events: [], decks: [], settings: {},
  courses: [{id: "c1", name: "Composition", code: "ENGL 102", color: "#7A4FD6"}]};
const USERS = {u1: "Maya", u2: "Sam"};
const DB = {groups: [{id: "g1", name: "Sleep Project", kind: "project"}], items: [], n: 0};
function db(user, q){
  const now = new Date(Date.now() + (DB.n++)).toISOString();
  if (q.table === "study_groups") return {data: DB.groups, error: null};
  let rows = DB.items;
  const match = r => (q.f || []).every(([op, k, v]) => op === "eq" ? r[k] === v : op === "in" ? v.includes(r[k]) : true);
  if (q.op === "select") { rows = rows.filter(match).sort((a, b) => b.updated_at.localeCompare(a.updated_at)); return {data: q.single ? rows[0] || null : rows, error: null}; }
  if (q.op === "insert") { const r = Object.assign({id: "i" + (DB.n++), user_id: user, author_name: USERS[user], created_at: now, updated_at: now}, q.body); DB.items.push(r); return {data: q.single ? r : [r], error: null}; }
  if (q.op === "update") { const hit = rows.filter(match).filter(r => r.user_id === user); hit.forEach(r => Object.assign(r, q.body, {updated_at: now})); return {data: q.single ? hit[0] || null : hit, error: null}; }
  return {data: null, error: {message: "unsupported"}};
}
// in the page: a stand-in for the Supabase client and the group's members
const FAKE = me => {
  window.__SB_TEST = true; window.__me = me;
  localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
  const B = (table) => { const q = {table, op: "select", f: []}; const o = {
    select(){ return o; }, insert(b){ q.op = "insert"; q.body = b; return o; }, update(b){ q.op = "update"; q.body = b; return o; },
    eq(k, v){ q.f.push(["eq", k, v]); return o; }, in(k, v){ q.f.push(["in", k, v]); return o; }, order(){ return o; }, limit(){ return o; }, single(){ q.single = true; return o; },
    then(res, rej){ return window.__db(JSON.stringify(q)).then(x => JSON.parse(x)).then(res, rej); }}; return o; };
  window.__fakeCli = {from: B, storage: {from: () => ({upload: async () => ({error: {message: "SB_GROUP_PRO: uploads need a Pro group"}})})}};
  window.__installFake = () => Object.assign(window.SBGROUPS.share, {online: () => true, cli: () => window.__fakeCli, myId: () => window.__me, myName: () => ({u1: "Maya", u2: "Sam"})[window.__me],
    loadMembers: async () => true, members: () => [{id: "u1", name: "Maya", color: "#E07A2E"}, {id: "u2", name: "Sam", color: "#1E9E74"}], avatar: () => "", matchCourse: () => "c1"});
};
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const b = await chromium.launch({executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]});
  const errs = [];
  async function person(me){
    const ctx = await b.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block", permissions: ["microphone"]});
    await ctx.exposeFunction("__db", s => JSON.stringify(db(me, JSON.parse(s))));
    await ctx.addInitScript(FAKE, me);
    await ctx.addInitScript(s => { if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); }, SEED);
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(me + ": " + e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|WebSocket|realtime|supabase/i.test(m.text())) errs.push(me + ": " + m.text()); });
    await p.goto("http://127.0.0.1:" + port + "/index.html");
    await p.waitForFunction(() => window.__sbSync && window.SBPRESENT && window.SBGROUPS && window.SBGROUPS.share && document.readyState === "complete", null, {timeout: 20000});
    await p.evaluate(() => { window.__installFake(); window.__sbPlanObj().isPro = () => true; }); await p.waitForTimeout(600);
    return p;
  }
  const goPresent = async p => { await p.evaluate(() => { const S = window.__sbSync; if (document.querySelector("dialog[open]")) document.querySelector("dialog[open]").close(); S.ui.tab = "flashcards"; S.ui.rvView = "present"; S.render(); }); await p.waitForTimeout(500); };
  const A = await person("u1"), Bp = await person("u2");

  // 5: the task sheet offers presentation practice for a presentation task
  const taskBtn = await A.evaluate(() => window.SBPRESENT.taskHtml(window.__sbSync.state.tasks.t1));
  ok(/Practise It/.test(taskBtn), "the task sheet offers to practise a presentation task");
  await A.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "present"; S.render(); });
  await A.waitForTimeout(400);
  await A.evaluate(() => { const d = document.createElement("button"); d.dataset.act = "prg-task-new"; d.dataset.id = "t1"; d.id = "__tb"; document.body.appendChild(d); });
  await A.click("#__tb"); await A.waitForSelector("#prFile", {state: "attached"});
  ok(await A.$eval("#prTask", e => e.value) === "t1", "starting from the task links the new presentation to it");
  await A.setInputFiles("#prFile", FX + "/present-deck.pptx"); await A.waitForSelector(".pr-picked", {timeout: 15000});
  await A.fill("#prName", "Teen Sleep Talk");
  await A.click('[data-act="pr-create"]'); await A.waitForSelector("#prStage .pr-play", {timeout: 15000}); await A.waitForTimeout(500);

  // 1 + 2: share with the group; speakers are its members
  await A.click('#prStage [data-act="prg-share"]'); await A.waitForSelector(".prg-sheet .prg-m", {timeout: 8000}); await A.waitForTimeout(300);
  ok(await A.locator(".prg-sheet .prg-m").count() === 2, "the share sheet lists the group's members as speakers");
  await A.screenshot({path: OUT + "-share.png"});
  await A.click('[data-act="prg-share-go"]'); await A.waitForTimeout(1200);
  const pres = DB.items.find(i => i.kind === "pres");
  ok(pres && pres.data.sp.length === 2 && pres.data.by.length === 6 && pres.data.sp[0].id === "u1" && pres.data.secret, "the group gets the presentation with two speakers and who presents each slide");
  ok(pres && pres.data.taskTitle === "Final Presentation" && pres.data.due === iso(2), "the shared presentation carries the task and its due date");
  ok(pres && !pres.data.path, "a free group shares the plan without the slides");
  ok(/The team/.test(await A.textContent("#prStage .pr-ready")), "the Ready card shows the team");
  // the owner's plan change reaches the group
  await A.click('[data-act="pr-plan"]'); await A.waitForSelector(".pr-plan-list .pr-pl"); await A.click('[data-act="pr-slide-t"][data-i="0"][data-d="15"]'); await A.waitForTimeout(2200);
  ok(DB.items.find(i => i.kind === "pres").data.plan.custom && DB.items.find(i => i.kind === "pres").data.plan.custom[0] === 75, "changing the plan updates the group's copy");
  await A.click('[data-act="pr-plan"]'); await A.waitForTimeout(200);

  // 3: Maya practises: her own slides' time against her target goes to the group
  await A.click('#prStage [data-act="pr-play"]'); await A.waitForTimeout(1200);
  for (let k = 0; k < 2; k++) { await A.keyboard.press("ArrowRight"); await A.waitForTimeout(600); }
  await A.click('#prStage [data-act="pr-end"]'); await A.waitForTimeout(1500);
  const run1 = DB.items.find(i => i.kind === "presrun" && i.user_id === "u1");
  ok(run1 && run1.data.b === 195000 && run1.data.t > 1000, "Maya's practice of her part goes to the group: " + (run1 && JSON.stringify(run1.data)));
  await A.screenshot({path: OUT + "-review.png"});

  // Sam adds his own copy and gets the plan and speakers
  await goPresent(Bp); await Bp.waitForTimeout(800); await goPresent(Bp);
  await Bp.waitForSelector('.prg-new [data-act="prg-add"]', {timeout: 8000});
  ok(/Teen Sleep Talk/.test(await Bp.textContent(".prg-new")) && /Add My Copy/.test(await Bp.textContent(".prg-new")), "Sam sees it under From Your Groups");
  await Bp.screenshot({path: OUT + "-from-groups.png"});
  await Bp.click('.prg-new [data-act="prg-add"]'); await Bp.waitForSelector("#prFile", {state: "attached"});
  ok(await Bp.locator(".pr-linknote").count() === 1, "adding without the slides asks for his copy and says where it's from");
  await Bp.setInputFiles("#prFile", FX + "/present-deck.pptx"); await Bp.waitForSelector(".pr-picked", {timeout: 15000});
  await Bp.click('[data-act="pr-create"]'); await Bp.waitForSelector("#prStage .pr-play", {timeout: 15000}); await Bp.waitForTimeout(800);
  const sp = await Bp.evaluate(() => { const p = window.SBPRESENT.list()[0]; return {name: p.name, g: p.group, share: p.share, custom: p.custom}; });
  ok(sp.name === "Teen Sleep Talk" && sp.g && sp.g.sp.map(s => s.name).join() === "Maya,Sam" && sp.share && !sp.share.own && sp.custom && sp.custom[0] === 75, "Sam's copy has the group's name, plan and speakers");
  ok(/Maya/.test(await Bp.textContent("#prStage .prg-team")) && /Not practised yet/.test(await Bp.textContent("#prStage .prg-team")), "Sam sees Maya's time and that he hasn't practised");
  ok(/Shared in Sleep Project/.test(await Bp.textContent("#prStage .pr-ready")), "his Ready card says the plan comes from the group");
  await Bp.screenshot({path: OUT + "-team.png"});
  const todayB = await Bp.evaluate(() => window.SBPRESENT.todayHtml());
  ok(/Practise <b>Teen Sleep Talk<\/b>, due/.test(todayB) && /not practised yet/.test(todayB), "Today's Plan suggests Sam practise before it's due: " + todayB.replace(/<[^>]+>/g, "").trim());
  await Bp.keyboard.press("Escape"); await Bp.waitForTimeout(500);

  // 4: live rehearsal: Maya leads, Sam joins and moves the slides
  await A.click('#prStage [data-act="pr-again"]'); await A.waitForSelector('#prStage [data-act="prg-live"]', {timeout: 10000}); await A.waitForTimeout(500);
  await A.click('#prStage [data-act="prg-live"]'); await A.waitForTimeout(2500);
  ok(DB.items.some(i => i.kind === "preslive" && !i.data.ended), "Rehearse Together tells the group a rehearsal is live");
  await goPresent(Bp); await Bp.waitForTimeout(400);
  await Bp.evaluate(() => { const S = window.__sbSync; S.render(); }); await Bp.waitForSelector('.prg-livebar [data-act="prg-join"]', {timeout: 25000});
  await Bp.screenshot({path: OUT + "-livebar.png"});
  await Bp.click('.prg-livebar [data-act="prg-join"]'); await Bp.waitForSelector("#prStage", {timeout: 10000}); await Bp.waitForTimeout(3500);
  ok(/Leave/.test(await Bp.textContent("#prStage .pr-end")), "Sam follows along (Leave instead of End)");
  await A.click('#prStage [data-act="pr-play"]'); await A.waitForTimeout(3000);
  const sClock = await Bp.textContent("#prStage .pr-clock b, #prStage #prClock").catch(() => "");
  ok(await Bp.evaluate(() => window.SBPRESENT.px.stage() && window.SBPRESENT.px.stage().started), "Sam's stage starts when Maya presses play " + sClock);
  await Bp.keyboard.press("ArrowRight"); await A.waitForTimeout(2000);
  ok(await A.evaluate(() => window.SBPRESENT.px.stage().i) === 1, "Sam moving to the next slide moves Maya's");
  ok(await Bp.evaluate(() => window.SBPRESENT.px.stage().i) === 1, "and his own follows");
  await Bp.screenshot({path: OUT + "-follow.png"});
  await A.keyboard.press("ArrowRight"); await A.waitForTimeout(1200);
  await A.click('#prStage [data-act="pr-end"]'); await A.waitForTimeout(3500);
  const bRuns = await Bp.evaluate(() => (window.SBPRESENT.list()[0].runs || []).map(r => ({live: r.live, ledBy: r.ledBy, n: r.times.length})));
  ok(bRuns.length === 1 && bRuns[0].live && bRuns[0].ledBy === "Maya", "Sam gets the run in his history: " + JSON.stringify(bRuns));
  ok(DB.items.some(i => i.kind === "preslive" && i.data.ended), "ending the run ends the live rehearsal");
  ok(DB.items.some(i => i.kind === "presrun" && i.user_id === "u2" && i.data.live), "Sam's part of the rehearsal goes to the team's progress");

  // the task sheet links to its presentation
  const th = await A.evaluate(() => window.SBPRESENT.taskHtml(window.__sbSync.state.tasks.t1));
  ok(/Teen Sleep Talk/.test(th) && /pr-practise/.test(th) && /shared with Sleep Project/.test(th), "the task sheet links to its presentation");
  // the group's Shared tab lists it with everyone's progress
  await A.evaluate(() => { const S = window.__sbSync; if (document.querySelector("#prStage")) document.querySelector("#prStage").remove(); S.ui.tab = "flashcards"; S.ui.rvView = "present"; S.render(); });
  await A.waitForTimeout(400);
  const gsec = await A.evaluate(async () => { await window.SBPRESENT._groups.load(true); const h = window.SBPRESENT._groups.secHtml("g1"); const el = document.createElement("section"); el.className = "card grp-sec prg-gsec"; el.style.cssText = "margin:16px 0;max-width:640px"; el.innerHTML = h; document.querySelector("#view").prepend(el); return el.textContent; });
  ok(/Teen Sleep Talk/.test(gsec) && /Maya ✓|Maya/.test(gsec) && /Sam/.test(gsec), "the group's Shared tab lists the presentation and each speaker's progress: " + gsec.replace(/\s+/g, " ").slice(0, 160));
  await A.screenshot({path: OUT + "-groupsec.png"});
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log("present-groups.e2e: done" + (process.exitCode ? "" : ", all passed"));
})().catch(e => { console.error(e); process.exit(1); });
