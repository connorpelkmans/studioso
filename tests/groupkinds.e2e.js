// Browser checks for the study group and group project pages (1.15), with an in-memory stand-in for the Supabase client (window.__sbGroupsStub).
// Run: node tests/groupkinds.e2e.js [screenshot-dir]      (needs Playwright; see tests/pw.js for how it and Chromium are found)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); }; const eq = (a, b, m) => { checks++; assert.deepStrictEqual(a, b, m); };

function stubInit(opts){
  const me = {id: opts.me, email: opts.me + "@x.com"};
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  const mem = (g, u, role, name) => ({group_id: g, user_id: u, role, display_name: name, joined_at: "2026-01-0" + (u.slice(1))});
  const NAMES = {u1: "Connor", u2: "Sam", u3: "Jo"};
  const DB = {
    study_groups: [{id: "g1", name: "Bio Squad", course: "BIOL 201", owner_id: "u1", invite_code: "ABC-DEF", created_at: "2026-01-01", weekly_goal: 0, kind: "study", project_due: null},
      {id: "g2", name: "Poster Team", course: "BIOL 201", owner_id: "u1", invite_code: "XYZ-123", created_at: "2026-01-02", weekly_goal: 0, kind: "project", project_due: day(opts.due == null ? 10 : opts.due)}],
    group_members: ["g1", "g2"].flatMap(g => [mem(g, "u1", "owner", "Connor"), mem(g, "u2", "member", "Sam"), mem(g, "u3", "member", "Jo")]),
    group_items: [], group_messages: [], study_profiles: [{user_id: opts.me, display_name: NAMES[opts.me]}], shared_decks: [], group_blocks: [],
    group_quiz_scores: [], group_rsvps: [], group_stats: [], group_checkins: [], group_reactions: [], group_task_lists: [], group_tasks: [], group_peer_ratings: []
  };
  let n = 0; const id = p => p + (++n), nowIso = () => new Date().toISOString();
  window.__DB = DB; window.__calls = []; window.__chans = [];
  const wait = v => new Promise(r => setTimeout(() => r(v), 15));
  const missing = t => (opts.missing || []).includes(t);
  const mk = t => {
    const st = {f: [], op: "select", payload: null, one: false, order: null};
    const run = () => {
      if (missing(t)) return wait({error: {code: "42P01", message: 'relation "public.' + t + '" does not exist'}});
      const rows = DB[t] || [], hit = rows.filter(r => st.f.every(f => f(r)));
      if (st.op === "insert") {
        if (t === "group_items" && !(opts.kinds || ["deck", "task", "quiz", "event", "qa", "answer", "link", "minutes", "role", "weak"]).includes([].concat(st.payload)[0].kind)) return wait({error: {code: "23514", message: 'new row violates check constraint "group_items_kind_check"'}});
        const add = [].concat(st.payload).map(r => Object.assign({id: id("r"), created_at: nowIso(), updated_at: nowIso(), user_id: me.id, author_name: NAMES[me.id]}, r));
        add.forEach(r => rows.push(r)); window.__calls.push(["insert", t, st.payload]); return wait({data: st.one ? add[0] : add});
      }
      if (st.op === "update") { hit.forEach(r => Object.assign(r, st.payload, {updated_at: nowIso()})); return wait({data: st.one ? hit[0] : hit}); }
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); return wait({data: null}); }
      const out = hit.slice(); if (st.order) out.sort((a, b) => (String(a[st.order[0]]) > String(b[st.order[0]]) ? 1 : -1) * (st.order[1] ? 1 : -1));
      return wait({data: st.one ? out[0] || null : out});
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      gte(c, v) { st.f.push(r => r[c] >= v); return api; }, order(c, o) { st.order = [c, !(o && o.ascending === false)]; return api; }, limit() { return api; },
      maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); }, insert(rows) { st.op = "insert"; st.payload = rows; return api; },
      update(p) { st.op = "update"; st.payload = p; return api; }, delete() { st.op = "delete"; return api; }, upsert(r) { st.op = "insert"; st.payload = r; return api; }, then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const E = m => ({error: {message: m}});
  const ownerOf = gid => DB.study_groups.some(g => g.id === gid && g.owner_id === me.id);
  const rpc = {
    create_task_list(a) { const r = {id: id("L"), group_id: a.p_group, title: String(a.p_title).trim(), course_code: a.p_course || "", created_by: me.id, created_at: nowIso(), archived: false}; DB.group_task_lists.push(r); return {data: r}; },
    add_group_task(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups");
      const r = {id: id("T"), list_id: l.id, group_id: l.group_id, title: String(a.p_title).trim(), notes: a.p_notes || "", status: "todo", assignee_id: a.p_assignee || null, due_at: a.p_due || null, priority: a.p_priority || null,
        position: Math.max(0, ...DB.group_tasks.filter(x => x.list_id === l.id).map(x => x.position)) + 1, created_by: me.id, created_at: nowIso(), updated_by: me.id, updated_at: nowIso(), completed_at: null, completed_by: null, deleted: false};
      DB.group_tasks.push(r); return {data: r}; },
    update_group_task(a) { const t = DB.group_tasks.find(x => x.id === a.p_task && !x.deleted); if (!t) return E("That task isn't in one of your groups"); Object.assign(t, a.p_patch);
      if (a.p_patch.status === "done") { t.completed_at = nowIso(); t.completed_by = me.id; } else if ("status" in a.p_patch) { t.completed_at = null; t.completed_by = null; } t.updated_by = me.id; t.updated_at = nowIso(); return {data: t}; },
    submit_peer(a) { if (a.p_to === me.id) return E("You can only rate someone else in the group"); if (a.p_score < 1 || a.p_score > 5) return E("Pick a score from 1 to 5");
      const ex = DB.group_peer_ratings.find(r => r.group_id === a.p_group && r.from_user === me.id && r.to_user === a.p_to);
      if (ex) Object.assign(ex, {score: a.p_score, note: a.p_note}); else DB.group_peer_ratings.push({group_id: a.p_group, from_user: me.id, to_user: a.p_to, score: a.p_score, note: a.p_note, updated_at: nowIso()}); return {data: null}; },
    peer_summary(a) { if (!ownerOf(a.p_group)) return E("Only the owner can see the summary"); const by = {};
      DB.group_peer_ratings.filter(r => r.group_id === a.p_group).forEach(r => { (by[r.to_user] = by[r.to_user] || []).push(r.score); });
      return {data: Object.keys(by).map(k => ({to_user: k, raters: by[k].length, avg_score: Math.round(by[k].reduce((x, y) => x + y, 0) / by[k].length * 10) / 10}))}; }
  };
  const client = {
    from: mk,
    rpc: (name, a) => { window.__calls.push(["rpc", name, a]);
      if (missing("group_peer_ratings") && /peer/.test(name)) return wait({error: {code: "PGRST202", message: "Could not find the function public." + name + " in the schema cache"}});
      return wait(rpc[name] ? rpc[name](a) : {data: null}); },
    channel: name => { const c = {name, h: [], on(type, cfg, cb) { c.h.push({cfg, cb}); return c; }, subscribe() { return c; }}; window.__chans.push(c); return c; },
    removeChannel(c) { c.gone = true; }
  };
  window.__sbGroupsStub = {user: me, client};
  window.__fire = table => { window.__chans.filter(c => !c.gone).forEach(c => c.h.forEach(h => { if (h.cfg.table === table) h.cb({eventType: "UPDATE", new: {}, old: {}}); })); };
  window.__day = day;
  try { localStorage.setItem("sb:grpName:" + me.id, NAMES[me.id]); } catch(e) {}
  if (opts.seed) { try { localStorage.setItem("coursework:v2", JSON.stringify(opts.seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } catch(e) {} }
}

const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [], notes: [],
  decks: [{id: "d1", name: "Cells", courseId: "c1", created: 1, cards: [
    {id: "k1", front: "Mitochondria", back: "Powerhouse of the cell", box: 1, due: "", seen: 3, right: 0, wrong: 3},
    {id: "k2", front: "Ribosome", back: "Makes protein", box: 1, due: "", seen: 2, right: 0, wrong: 2},
    {id: "k3", front: "Nucleus", back: "Holds DNA", box: 4, due: "", seen: 4, right: 4, wrong: 0}]}]};

async function boot(browser, w, opts){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, Object.assign({seed: SEED}, opts));
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  return {ctx, page, errs};
}
const act = (page, a) => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, a);
async function openGroup(page, gid){
  await act(page, "grp-page"); await page.waitForSelector(`[data-act="grp-open"][data-id="${gid}"]`); await page.click(`[data-act="grp-open"][data-id="${gid}"]`);
  await page.waitForSelector("#grpDetail"); await page.waitForTimeout(700);
}
const tab = async (page, t) => { await page.click(`[data-act="grp-tab"][data-t="${t}"]`); await page.waitForTimeout(80); };
const tabs = page => page.$$eval(".grp-tabs [role=tab]", e => e.map(x => x.innerText.trim()));
const txt = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ") : ""; }, sel);
const noOverflow = async (page, label) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal overflow: " + label);
const sheet = (page, sel) => page.waitForSelector("dialog[open] " + sel);

async function studyGroup(browser, w){
  const tag = "study " + w + "px", {ctx, page, errs} = await boot(browser, w, {me: "u1"});
  await openGroup(page, "g1");
  eq(await tabs(page), ["Study", "Sessions", "Challenge", "Chat", "Members"], tag + " tabs");
  ok(/study group/i.test(await txt(page, "#grpHead")) && await page.$("#grpHead.k-study") !== null, tag + " header says Study Group");
  ok(await page.$("#grpOverview") === null || (await page.$eval("#grpOverview", e => e.children.length)) === 0, tag + " no project overview in a study group");
  // Study tab: decks, quizzes, weak spots, Q&A
  ok(await page.isVisible("#grpDecks") && await page.isVisible("#grpQuizzes") && await page.isVisible("#grpWeak") && await page.isVisible("#grpQA"), tag + " Study tab holds decks, quizzes, weak spots and Q&A");
  ok(!(await page.isVisible("#grpChallenge")) && !(await page.isVisible("#grpSessions")), tag + " challenge and sessions are on their own tabs");
  // Q&A
  ok(/Stuck on something/.test(await txt(page, "#grpQA")), tag + " Q&A empty state");
  await page.click('[data-act="grp-q-new"]'); await sheet(page, 'input[name="title"]');
  await page.fill('dialog input[name="title"]', "Why does the Krebs cycle need oxygen?"); await page.fill('dialog textarea[name="body"]', "I thought it never touches O2.");
  await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
  ok(/Krebs cycle/.test(await txt(page, "#grpQA")) && /0 answers/.test(await txt(page, "#grpQA")), tag + " question appears");
  ok(await page.evaluate(() => window.__DB.group_items.some(i => i.kind === "qa" && i.data.body && i.data.solved === false)), tag + " question saved with its details");
  await page.evaluate(() => { const q = window.__DB.group_items.find(i => i.kind === "qa"); window.__DB.group_items.push({id: "a-sam", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "answer", ref_id: q.id, title: "NADH needs it", data: {v: 1, body: "NADH is re-oxidised by the electron transport chain, which needs O2."}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); window.__fire("group_items"); });
  await page.waitForTimeout(900);
  ok(/1 answer/.test(await txt(page, "#grpQA")), tag + " a teammate's answer arrives live");
  await page.click('#grpQA [data-act="grp-q-open"]'); await sheet(page, "#gkThread");
  ok(/NADH is re-oxidised/.test(await txt(page, "#gkThread")), tag + " thread shows the answer");
  await page.fill("#gkAnswerIn", "Same question here!"); await page.press("#gkAnswerIn", "Control+Enter").catch(() => {}); await page.click('#gkAnswer button[type="submit"]'); await page.waitForTimeout(300);
  ok(/2 Answers/.test(await txt(page, "#gkThread")), tag + " I can answer too");
  await page.click('[data-act="grp-q-best"][data-a="a-sam"]'); await page.waitForTimeout(250);
  ok(/Best answer/.test(await txt(page, "#gkThread")) && /Solved/.test(await txt(page, "#gkThread")), tag + " best answer marks it solved");
  ok(await page.evaluate(() => { const q = window.__DB.group_items.find(i => i.kind === "qa"); return q.data.solved === true && q.data.best === "a-sam"; }), tag + " saved");
  eq(await page.$$eval("#gkThread .grp-item .grp-item-main span:first-child", e => e[0].innerText.slice(0, 19)), "NADH is re-oxidised", tag + " best answer is listed first");
  await page.screenshot({path: path.join(shots, `gk-study-${w}-thread.png`)});
  await page.keyboard.press("Escape"); await page.waitForTimeout(100);
  ok(/Solved/.test(await txt(page, "#grpQA")), tag + " list shows Solved");
  // Weak spots
  await page.click('[data-act="grp-weak-share"]'); await sheet(page, 'input[name="c"]');
  eq(await page.$$eval('dialog input[name="c"]', e => e.length), 2, tag + " my two missed cards are offered (not the one I know)");
  await page.uncheck('dialog input[name="c"] >> nth=1'); await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
  ok(/Mitochondria/.test(await txt(page, "#grpWeak")) && !/Ribosome/.test(await txt(page, "#grpWeak")), tag + " only the chosen card is shared");
  ok(await page.evaluate(() => { const i = window.__DB.group_items.find(x => x.kind === "weak"); return i && i.data.cards.length === 1 && i.ref_id === "u1" && !("wrong" in i.data.cards[0]) && !("right" in i.data.cards[0]); }), tag + " no scores leave the device");
  await page.evaluate(() => { window.__DB.group_items.push({id: "w-sam", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "weak", ref_id: "u2", title: "Weak spots", data: {v: 1, cards: [{f: "mitochondria", b: "Powerhouse", d: "Cells", n: 2}, {f: "Golgi", b: "Packages proteins", d: "Cells", n: 1}]}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); window.__fire("group_items"); });
  await page.waitForTimeout(900);
  const wk = await txt(page, "#grpWeak");
  ok(/2 members keep missing this/.test(wk) && /1 member keeps missing this/.test(wk) && wk.indexOf("Mitochondria") < wk.indexOf("Golgi"), tag + " the group's most-missed card ranks first: " + wk);
  await page.click('[data-act="grp-weak-deck"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => Object.values(window.SBPINPICK ? window.SBPINPICK.state().decks : {}).some(d => /Weak Spots: Bio Squad/.test(d.name) && d.cards.length === 2)), tag + " a deck is made from the group's weak spots");
  await page.click('[data-act="grp-weak-stop"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !window.__DB.group_items.some(x => x.kind === "weak" && x.user_id === "u1")), tag + " I can stop sharing");
  await noOverflow(page, tag + " study tab");
  await page.screenshot({path: path.join(shots, `gk-study-${w}-study.png`), fullPage: true});
  // Sessions and Challenge tabs
  await tab(page, "sessions"); ok(await page.isVisible("#grpSessions") && /Study Sessions/.test(await txt(page, "#grpSessions")), tag + " Sessions tab");
  await tab(page, "challenge");
  ok(await page.isVisible("#grpChallenge") && await page.isVisible("#grpCheckin"), tag + " Challenge tab holds the weekly challenge and check-in");
  ok(/Share a practice quiz/.test(await txt(page, "#grpBattle")), tag + " battle invites sharing a quiz");
  await page.evaluate(() => { const now = new Date().toISOString(), D = window.__DB;
    D.group_items.push({id: "qz1", group_id: "g1", user_id: "u2", author_name: "Sam", kind: "quiz", ref_id: "d:q", title: "Cell quiz", data: {quiz: {questions: [{}]}}, created_at: now, updated_at: now});
    D.group_quiz_scores.push({item_id: "qz1", group_id: "g1", user_id: "u2", best_correct: 9, best_total: 10, last_correct: 9, last_total: 10, attempts: 1}, {item_id: "qz1", group_id: "g1", user_id: "u3", best_correct: 6, best_total: 10, last_correct: 6, last_total: 10, attempts: 2});
    window.__fire("group_items"); window.__fire("group_quiz_scores"); });
  await page.waitForTimeout(1200);
  const bt = await txt(page, "#grpBattle"); ok(/Quiz Battle/.test(bt) && bt.indexOf("Sam") < bt.indexOf("Jo") && /90%/.test(bt) && /60%/.test(bt) && /Hasn't played yet/.test(bt), tag + " quiz battle ranks by average best score: " + bt);
  await noOverflow(page, tag + " challenge tab");
  await page.screenshot({path: path.join(shots, `gk-study-${w}-challenge.png`), fullPage: true});
  // creating a group shows what each kind comes with
  await act(page, "grp-back"); await page.waitForSelector("[data-grp-list]"); await act(page, "grp-new"); await sheet(page, ".gk-kind-note");
  ok(/Quiz Battle/.test(await txt(page, "dialog .gk-kind-note:not([hidden])")) && await page.$$eval("dialog .gk-kind-note:not([hidden]) .gk-kind-tabs span", e => e.map(x => x.innerText).join()) === "Study,Sessions,Challenge,Chat,Members", tag + " the study preview lists its tabs");
  await page.click('dialog .grp-kind [data-kind="project"]');
  ok(await page.$$eval("dialog .gk-kind-note:not([hidden]) .gk-kind-tabs span", e => e.map(x => x.innerText).join()) === "Overview,Tasks,Files,Meetings,Chat,Members" && /Create Project/.test(await txt(page, "#grpSave")), tag + " the project preview lists its tabs");
  await page.screenshot({path: path.join(shots, `gk-create-${w}.png`)});
  ok(errs.length === 0, tag + " no page errors " + errs.join(" | "));
  await ctx.close();
}

async function projectGroup(browser, w){
  const tag = "project " + w + "px", {ctx, page, errs} = await boot(browser, w, {me: "u1"});
  await openGroup(page, "g2");
  eq(await tabs(page), ["Overview", "Tasks", "Files", "Meetings", "Chat", "Members"], tag + " tabs");
  ok(await page.$("#grpHead.k-project") !== null && /group project/i.test(await txt(page, "#grpHead")) && /Invite Teammates/.test(await txt(page, "#grpHead")), tag + " header says Group Project");
  ok(await page.evaluate(() => getComputedStyle(document.querySelector("#grpDetail")).getPropertyValue("--gk").trim()) === "#C9702B", tag + " the project has its own accent colour");
  // Overview
  ok(/10 days left/.test(await txt(page, "#grpOverview .gk-hero")), tag + " countdown: " + await txt(page, "#grpOverview .gk-hero"));
  ok(await page.isVisible("#grpOverview") && !(await page.isVisible("#grpDecks")) , tag + " Overview is the first tab");
  ok(/No tasks yet/.test(await txt(page, "#grpOverview")), tag + " empty overview offers a plan");
  await page.click('#grpOverview [data-act="grp-role-set"][data-r="lead"]'); await page.waitForTimeout(300);
  ok(/You're the Lead/.test(await txt(page, "#grpOverview")) && await page.evaluate(() => window.__DB.group_items.some(i => i.kind === "role" && i.user_id === "u1" && i.data.role === "lead")), tag + " I picked Lead");
  await page.click('#grpOverview [data-act="grp-role-set"][data-r="editor"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__DB.group_items.filter(i => i.kind === "role").length === 1 && window.__DB.group_items.find(i => i.kind === "role").data.role === "editor"), tag + " changing role updates the one role item");
  ok(/Editor/.test(await txt(page, "#grpOverview .gk-team")), tag + " roles list shows it");
  // Tasks: plan from the due date, then the board
  await tab(page, "tasks");
  ok(await page.isVisible("#grpPT") && /Start From a Plan/.test(await txt(page, "#grpPT")), tag + " Tasks tab offers a plan");
  await page.click('#grpPT [data-act="grp-pt-plan"]'); await sheet(page, "[data-act]"); await page.screenshot({path: path.join(shots, `gk-project-${w}-plan.png`)});
  const confirmBtn = page.locator("dialog button.primary, dialog button.btn.danger").last(); await confirmBtn.click(); await page.waitForTimeout(1200);
  const planTasks = await page.evaluate(() => window.__DB.group_tasks.map(t => [t.title, t.due_at]));
  eq(planTasks.length, 6, tag + " six milestones created"); eq(planTasks[5][1], await page.evaluate(() => window.__DB.study_groups[1].project_due), tag + " the last milestone is the due date");
  ok(planTasks.every((t, i) => !i || t[1] >= planTasks[i - 1][1]), tag + " milestones are in date order");
  await page.click('#grpPT [data-act="grp-pt-view"][data-v="board"]'); await page.waitForTimeout(150);
  eq(await page.$$eval("#grpPT .kb-col h4", e => e.map(x => x.innerText.replace(/\s+/g, " "))), ["To Do 6", "In Progress 0", "Done 0"], tag + " board columns");
  await page.click('#grpPT .kb-card >> nth=0 >> [data-act="grp-pt-status"]'); await page.waitForTimeout(300);
  eq(await page.$$eval("#grpPT .kb-col h4", e => e.map(x => x.innerText.replace(/\s+/g, " "))), ["To Do 5", "In Progress 1", "Done 0"], tag + " Start moves a card to In Progress");
  await page.click('#grpPT .k-doing [data-act="grp-pt-status"] >> nth=-1'); await page.waitForTimeout(300);
  eq(await page.$$eval("#grpPT .kb-col h4", e => e.map(x => x.innerText.replace(/\s+/g, " "))), ["To Do 5", "In Progress 0", "Done 1"], tag + " Done moves it to Done");
  ok(await page.evaluate(() => window.__DB.group_tasks.filter(t => t.status === "done").length) === 1, tag + " saved to the server");
  await noOverflow(page, tag + " board"); await page.screenshot({path: path.join(shots, `gk-project-${w}-board.png`), fullPage: true});
  await tab(page, "overview");
  ok(/17%/.test(await txt(page, "#grpOverview .gk-hero")) && /1 of 6 tasks done/.test(await txt(page, "#grpOverview .gk-hero")), tag + " overview progress follows the board: " + await txt(page, "#grpOverview .gk-hero"));
  await page.evaluate(() => { const t = window.__DB.group_tasks[2]; t.assignee_id = "u3"; t.due_at = window.__day(-2); window.__fire("group_tasks"); });
  await page.waitForTimeout(1200);
  ok(/Jo/.test(await txt(page, "#grpOverview .gk-behind")) && /1 overdue task/.test(await txt(page, "#grpOverview .gk-behind")), tag + " Who's Behind names Jo: " + await txt(page, "#grpOverview"));
  await page.screenshot({path: path.join(shots, `gk-project-${w}-overview.png`), fullPage: true});
  // Files and links
  await tab(page, "files"); ok(/Add the first link/.test(await txt(page, "#grpFiles")), tag + " files empty state");
  await page.click('[data-act="grp-link-new"]'); await sheet(page, 'input[name="url"]');
  await page.fill('dialog input[name="title"]', "Poster draft"); await page.fill('dialog input[name="url"]', "not a link at all"); await page.click("dialog [data-submit]"); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !window.__DB.group_items.some(i => i.kind === "link")), tag + " a bad link is refused");
  await page.fill('dialog input[name="url"]', "javascript:alert(1)"); await page.click("dialog [data-submit]"); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !window.__DB.group_items.some(i => i.kind === "link")), tag + " a javascript: link is refused");
  await page.fill('dialog input[name="url"]', "https://www.docs.google.com/presentation/d/abc"); await page.fill('dialog input[name="note"]', "Edit access for all"); await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
  ok(/Poster draft/.test(await txt(page, "#grpFiles")) && /docs\.google\.com/.test(await txt(page, "#grpFiles")), tag + " the link is listed with its site");
  eq(await page.$eval('#grpFiles a[href]', a => [a.target, a.rel]), ["_blank", "noopener noreferrer"], tag + " links open safely");
  await page.evaluate(() => window.__DB.group_items.push({id: "evil", group_id: "g2", user_id: "u2", author_name: "Sam", kind: "link", ref_id: "", title: "Sneaky", data: {url: "javascript:alert(1)"}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()}));
  await page.evaluate(() => window.__fire("group_items")); await page.waitForTimeout(900);
  ok(!/Sneaky/.test(await txt(page, "#grpFiles")), tag + " a hostile link from someone else is never shown");
  await noOverflow(page, tag + " files");
  // Meetings: notes become tasks
  await tab(page, "meetings"); ok(await page.isVisible("#grpSessions") && /Meetings/.test(await txt(page, "#grpSessions")) && await page.isVisible("#grpMinutes"), tag + " Meetings tab holds meetings and notes");
  await page.click('[data-act="grp-min-new"]'); await sheet(page, 'input[name="title"]');
  await page.fill('dialog input[name="title"]', "Kickoff call"); await page.fill('dialog textarea[name="decisions"]', "Poster on cell respiration.");
  await page.fill('dialog textarea[name="actions"]', "Sam: book the printer\n- Jo: collect figures\nBuy markers");
  const before = await page.evaluate(() => window.__DB.group_tasks.length);
  await page.click("dialog [data-submit]"); await page.waitForTimeout(1200);
  const added = await page.evaluate(b => window.__DB.group_tasks.slice(b).map(t => [t.title, t.assignee_id]), before);
  eq(added, [["book the printer", "u2"], ["collect figures", "u3"], ["Buy markers", null]], tag + " action items became assigned tasks");
  ok(/Kickoff call/.test(await txt(page, "#grpMinutes")) && /Actions added to Tasks/.test(await txt(page, "#grpMinutes")), tag + " notes are listed");
  await page.click("#grpMinutes summary"); ok(/Poster on cell respiration/.test(await txt(page, "#grpMinutes")), tag + " notes open to show the decisions");
  await noOverflow(page, tag + " meetings"); await page.screenshot({path: path.join(shots, `gk-project-${w}-meetings.png`), fullPage: true});
  // Members: roles and the private check-in
  await tab(page, "members");
  ok(/Editor/.test(await txt(page, "#grpMembers")), tag + " the member list shows roles");
  ok(/Contribution Check-in/.test(await txt(page, "#grpPeer")) && /It's private/.test(await txt(page, "#grpPeer")) && /haven't rated anyone/.test(await txt(page, "#grpPeer")), tag + " check-in is open with 10 days left");
  await page.evaluate(() => { window.__DB.group_peer_ratings.push({group_id: "g2", from_user: "u2", to_user: "u1", score: 5, note: "secret", updated_at: ""}, {group_id: "g2", from_user: "u3", to_user: "u1", score: 4, note: "", updated_at: ""}); });
  await page.click('[data-act="grp-peer-open"]'); await sheet(page, ".gk-scale");
  eq(await page.$$eval("dialog .gk-peer legend", e => e.map(x => x.innerText.trim().replace(/^\S+\s+/, ""))), ["Sam", "Jo"], tag + " I rate the others, not myself");
  await page.click('dialog .gk-peer:has-text("Sam") label:has-text("Did more than their share")'); await page.fill('dialog input[name="n-u2"]', "Great at the figures");
  await page.screenshot({path: path.join(shots, `gk-project-${w}-peer.png`)});
  await page.click("dialog [data-submit]"); await page.waitForTimeout(900);
  const mine = await page.evaluate(() => window.__DB.group_peer_ratings.filter(r => r.from_user === "u1").map(r => [r.to_user, r.score, r.note]));
  eq(mine, [["u2", 4, "Great at the figures"]], tag + " my rating is saved");
  ok(/rated 1 of 2/.test(await txt(page, "#grpPeer")), tag + " progress: " + await txt(page, "#grpPeer"));
  const own = await txt(page, "#grpPeer"); ok(/Team Averages/.test(own) && /4\.5/.test(own) && /2 ratings/.test(own) && !/secret/.test(own) && !/Great at the figures/.test(own), tag + " the owner sees averages only, no notes: " + own);
  await noOverflow(page, tag + " members");
  ok(errs.length === 0, tag + " no page errors " + errs.join(" | "));
  await ctx.close();
}

async function memberView(browser){
  const {ctx, page, errs} = await boot(browser, 1280, {me: "u2", due: 30});
  await openGroup(page, "g2"); await tab(page, "members");
  ok(/Opens two weeks before the due date/.test(await txt(page, "#grpPeer")), "member: check-in is closed with 30 days left");
  ok(/Owner|owner/.test(await txt(page, "#grpMembers")), "member: members list");
  await tab(page, "overview"); ok(/30 days left/.test(await txt(page, "#grpOverview .gk-hero")), "member: countdown");
  ok(!/Set a due date/.test(await txt(page, "#grpOverview")), "member: no owner prompts");
  ok(errs.length === 0, "member: no page errors " + errs.join(" | "));
  await ctx.close();
}
async function overdueAndSetup(browser){
  let r = await boot(browser, 1280, {me: "u1", due: -3});
  await openGroup(r.page, "g2");
  ok(/3 days overdue/.test(await txt(r.page, "#grpOverview .gk-hero")) && await r.page.$(".gk-hero.k-overdue") !== null, "overdue project shows the overdue state");
  await tab(r.page, "members"); ok(/haven't rated anyone/.test(await txt(r.page, "#grpPeer")), "the check-in stays open after the due date");
  ok(r.errs.length === 0, "overdue: no page errors " + r.errs.join(" | ")); await r.ctx.close();
  // the new SQL has not been run: nothing breaks, the owner is told once, and adding something says what is missing
  r = await boot(browser, 1280, {me: "u1", missing: ["group_peer_ratings"], kinds: ["deck", "task", "quiz", "event"]});
  await openGroup(r.page, "g2"); await tab(r.page, "members");
  ok(/groups\.sql/.test(await txt(r.page, "#grpPeer")), "owner sees the run groups.sql note for the check-in");
  await tab(r.page, "files"); await r.page.click('[data-act="grp-link-new"]'); await sheet(r.page, 'input[name="url"]');
  await r.page.fill('dialog input[name="title"]', "x"); await r.page.fill('dialog input[name="url"]', "https://example.com"); await r.page.click("dialog [data-submit]"); await r.page.waitForTimeout(500);
  ok(/groups\.sql|setup|available yet/i.test(await r.page.evaluate(() => document.querySelector("#toast, .toast") ? document.querySelector("#toast, .toast").innerText : document.body.innerText)), "adding a link without the new SQL says what's missing");
  ok(await r.page.isVisible("#grpFiles"), "the page still works");
  await r.ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const w of [1280, 390]) { await studyGroup(browser, w); await projectGroup(browser, w); }
    await memberView(browser); await overdueAndSetup(browser);
  } finally { await browser.close(); }
  console.log(`groupkinds.e2e.js: ${checks} checks passed. Screenshots in ${shots}`);
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
