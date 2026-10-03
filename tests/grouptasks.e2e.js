// Browser checks for Project Tasks with an in-memory stand-in for the Supabase client (window.__sbGroupsStub).
// Run: node tests/grouptasks.e2e.js [path/to/index.html] [screenshot-dir]      (needs Playwright; uses /opt/node-tools and /opt/pw-browsers when present)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const shots = path.resolve(process.argv[3] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
let chromium;
try { chromium = require("playwright").chromium; } catch(e) { chromium = require("/opt/node-tools/node_modules/playwright").chromium; }
const exe = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); };

// The stand-in client: tables in memory, the Project Task RPCs with the same rules as groups.sql, and channels you can fire by hand.
function stubInit(opts){
  const me = {id: opts.me, email: opts.me + "@x.com"};
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  const DB = {
    study_groups: [{id: "g1", name: "Bio Squad", course: "BIOL 201", owner_id: "u1", invite_code: "ABC-DEF", created_at: "2026-01-01", weekly_goal: 0}],
    group_members: [{group_id: "g1", user_id: "u1", role: "owner", display_name: "Connor", joined_at: "2026-01-01"}, {group_id: "g1", user_id: "u2", role: "member", display_name: "Sam", joined_at: "2026-01-02"}, {group_id: "g1", user_id: "u3", role: "member", display_name: "Jo", joined_at: "2026-01-03"}],
    group_items: [], group_messages: [], study_profiles: [{user_id: opts.me, display_name: opts.me === "u1" ? "Connor" : "Sam"}], shared_decks: [], group_blocks: [],
    group_quiz_scores: [], group_rsvps: [], group_stats: [], group_checkins: [], group_reactions: [],
    group_task_lists: [], group_tasks: []
  };
  const nowIso = () => new Date().toISOString(); let n = 0; const id = p => p + (++n);
  if (opts.seed) {
    DB.group_task_lists.push({id: "L1", group_id: "g1", title: "BIOL 201 Poster", course_code: "BIOL 201", created_by: "u2", created_at: "2026-02-01T00:00:00Z", archived: false});
    const t = (i, title, who, due, extra) => Object.assign({id: i, list_id: "L1", group_id: "g1", title, notes: "", status: "todo", assignee_id: who, due_at: due, priority: null, position: DB.group_tasks.length + 1, created_by: "u2", created_at: "2026-02-01T00:00:0" + DB.group_tasks.length + "Z", updated_by: "u2", updated_at: "2026-02-01T00:00:00Z", completed_at: null, completed_by: null, deleted: false}, extra || {});
    DB.group_tasks.push(t("s1", "Write the methods section", "u1", day(2)), t("s2", "Collect survey data", "u1", day(-1)), t("s3", "Design the poster layout", "u2", day(5)), t("s4", "Proofread", null, null), t("s5", "Book printing", "u3", day(-2), {created_by: "u3"}));
  }
  window.__DB = DB; window.__calls = []; window.__chans = []; window.__fail = null; window.__offline = false;
  const tableMissing = t => (opts.missing || []).includes(t);
  const wait = (v, ms) => new Promise(r => setTimeout(() => r(v), ms == null ? 25 : ms));
  const net = () => ({error: {message: "Failed to fetch"}});
  const mk = t => {
    const st = {f: [], op: "select", payload: null, one: false, order: null};
    const run = () => {
      if (window.__offline) return wait(net());
      if (tableMissing(t)) return wait({error: {code: "42P01", message: 'relation "public.' + t + '" does not exist'}});
      const rows = DB[t] || [], hit = rows.filter(r => st.f.every(f => f(r)));
      if (st.op === "insert") { const add = [].concat(st.payload).map(r => Object.assign({id: id("r")}, r)); add.forEach(r => rows.push(r)); window.__calls.push(["insert", t, st.payload]); return wait({data: st.one ? add[0] : add}); }
      if (st.op === "update") { hit.forEach(r => Object.assign(r, st.payload)); return wait({data: st.one ? hit[0] : hit}); }
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); return wait({data: null}); }
      let out = hit.slice(); if (st.order) out.sort((a, b) => (String(a[st.order[0]]) > String(b[st.order[0]]) ? 1 : -1) * (st.order[1] ? 1 : -1));
      if (st.one) return wait({data: out[0] || null});
      return wait({data: out});
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      gte(c, v) { st.f.push(r => r[c] >= v); return api; }, order(c, o) { st.order = [c, !(o && o.ascending === false)]; return api; }, limit() { return api; },
      maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); },
      insert(rows) { st.op = "insert"; st.payload = rows; return api; }, update(p) { st.op = "update"; st.payload = p; return api; }, delete() { st.op = "delete"; return api; },
      upsert(r) { st.op = "insert"; st.payload = r; return api; }, then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const E = m => ({error: {message: m}});
  const memberOf = (gid, u) => DB.group_members.some(m => m.group_id === gid && m.user_id === u);
  const ownerOf = gid => DB.study_groups.some(g => g.id === gid && g.owner_id === me.id);
  const rpc = {
    create_task_list(a) { if (!memberOf(a.p_group, me.id)) return E("You're not in that group"); if (DB.group_task_lists.filter(l => l.group_id === a.p_group && !l.archived).length >= 20) return E("A group can keep up to 20 task lists. Archive or delete one first.");
      const r = {id: id("L"), group_id: a.p_group, title: String(a.p_title).trim(), course_code: a.p_course || "", created_by: me.id, created_at: nowIso(), archived: false}; DB.group_task_lists.push(r); return {data: r}; },
    update_task_list(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups"); Object.assign(l, a.p_patch); return {data: l}; },
    delete_task_list(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups"); if (!(l.created_by === me.id || ownerOf(l.group_id))) return E("Only the group owner or whoever made the list can delete it");
      DB.group_task_lists = DB.group_task_lists.filter(x => x !== l); DB.group_tasks = DB.group_tasks.filter(x => x.list_id !== l.id); return {data: null}; },
    add_group_task(a) { const l = DB.group_task_lists.find(x => x.id === a.p_list); if (!l) return E("That list isn't in one of your groups"); if (a.p_assignee && !memberOf(l.group_id, a.p_assignee)) return E("You can only assign a task to someone in the group.");
      const r = {id: id("T"), list_id: l.id, group_id: l.group_id, title: String(a.p_title).trim(), notes: a.p_notes || "", status: "todo", assignee_id: a.p_assignee || null, due_at: a.p_due || null, priority: a.p_priority || null,
        position: Math.max(0, ...DB.group_tasks.filter(x => x.list_id === l.id).map(x => x.position)) + 1, created_by: me.id, created_at: nowIso(), updated_by: me.id, updated_at: nowIso(), completed_at: null, completed_by: null, deleted: false};
      DB.group_tasks.push(r); return {data: r}; },
    update_group_task(a) { const t = DB.group_tasks.find(x => x.id === a.p_task && !x.deleted); if (!t) return E("That task isn't in one of your groups"); const p = a.p_patch;
      if ("assignee_id" in p && p.assignee_id !== t.assignee_id && t.assignee_id && !(t.assignee_id === me.id || ownerOf(t.group_id))) return E("Only the person it's assigned to, or the group owner, can reassign this task");
      Object.assign(t, p); if (p.status === "done") { t.completed_at = nowIso(); t.completed_by = me.id; } else if ("status" in p) { t.completed_at = null; t.completed_by = null; } t.updated_by = me.id; t.updated_at = nowIso(); return {data: t}; },
    move_group_task(a) { return {data: null}; },
    delete_group_task(a) { const t = DB.group_tasks.find(x => x.id === a.p_task); if (!t) return E("That task isn't in one of your groups"); if (!(t.created_by === me.id || ownerOf(t.group_id))) return E("Only the group owner or whoever added the task can remove it"); t.deleted = true; return {data: null}; }
  };
  const client = {
    from: mk,
    rpc: (name, a) => {
      window.__calls.push(["rpc", name, a]);
      if (window.__offline) return wait(net());
      if (window.__fail && (window.__fail === name || window.__fail === "*")) { const m = window.__failMsg || "Something went wrong"; window.__fail = null; return wait(E(m)); }
      if (tableMissing("group_tasks") && /task/.test(name)) return wait({error: {code: "PGRST202", message: "Could not find the function public." + name + " in the schema cache"}});
      return wait(rpc[name] ? rpc[name](a) : {data: null});
    },
    channel: name => { const c = {name, h: [], on(type, cfg, cb) { c.h.push({cfg, cb}); return c; }, subscribe() { return c; }}; window.__chans.push(c); return c; },
    removeChannel(c) { c.gone = true; }
  };
  window.__sbGroupsStub = {user: me, client};
  try { localStorage.setItem("sb:grpName:" + me.id, me.id === "u1" ? "Connor" : "Sam"); } catch(e) {}
  window.__fire = (table, ev) => { window.__chans.filter(c => !c.gone).forEach(c => c.h.forEach(h => { if (h.cfg.table === table) h.cb({eventType: ev || "UPDATE", new: {}, old: {}}); })); };
}

async function boot(browser, w, opts){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, opts);
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  return {ctx, page, errs};
}
const click = (page, sel) => page.evaluate(sel => { const b = document.createElement("button"); b.dataset.act = sel; document.body.appendChild(b); b.click(); b.remove(); }, sel);
async function openGroup(page){
  await click(page, "grp-page"); await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]');
  await page.waitForSelector("#grpPT", {timeout: 5000}); await page.waitForTimeout(700);
}
const txt = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ") : ""; }, sel);
const noOverflow = async (page, label) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal overflow: " + label);

async function scenario(browser, w){
  const tag = w + "px";
  const {ctx, page, errs} = await boot(browser, w, {me: "u1"});
  await openGroup(page);
  // empty state
  ok(/Split up the work/.test(await txt(page, "#grpPT")), tag + " empty state wording");
  await page.screenshot({path: path.join(shots, `pt-${w}-0-empty.png`), fullPage: false});
  // create a list
  await page.click('[data-act="grp-pt-list-new"]'); await page.fill('dialog input[name="title"]', "BIOL 201 Poster"); await page.fill('dialog input[name="course"]', "BIOL 201");
  await page.click("dialog [data-submit]"); await page.waitForTimeout(400);
  ok(/BIOL 201 Poster/.test(await txt(page, ".pt-lists")), tag + " list chip shows");
  ok(/Split up the work: add the first task/.test(await txt(page, "#grpPT")), tag + " empty list wording");
  // add tasks
  const add = async (title, who, due) => { await page.fill("#ptTitle", title); if (who) await page.selectOption("#ptWho", who); if (due) await page.fill("#ptDue", due); await page.press("#ptTitle", "Enter"); await page.waitForTimeout(200); };
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  await add("Draft the intro", "u2", day(2));
  await add("Find three figures", "", "");
  await add("Make the slides", "u1", day(-1));
  await add("Write the abstract", "u3", day(-3));
  await page.waitForTimeout(300);
  let rows = await page.$$eval(".pt-task", els => els.map(e => e.innerText.replace(/\s+/g, " ")));
  ok(rows.length === 4, tag + " four tasks listed, got " + rows.length);
  ok(/Draft the intro.*Sam.*Due/.test(rows[0]), tag + " assignee chip and due pill: " + rows[0]);
  ok(/Find three figures.*Unassigned/.test(rows[1]) && /Claim this/.test(rows[1]), tag + " unassigned task offers Claim this: " + JSON.stringify(rows));
  ok(/overdue|yesterday/.test(rows[2]) && /You/.test(rows[2]), tag + " my overdue task: " + rows[2]);
  ok(await page.$$eval(".pt-due.late", e => e.length) === 2, tag + " two overdue pills");
  ok(await page.$$eval(".pt-due.soon", e => e.length) === 1, tag + " one due-soon pill");
  ok(/0 of 4 done/.test(await txt(page, ".pt-prog")), tag + " progress 0 of 4");
  const load = await txt(page, ".pt-load"); ok(/Sam\s+1 open/.test(load) && /You\s+1 open/.test(load) && /Jo\s+1 open/.test(load) && /Unassigned\s+1 open/.test(load), tag + " workload summary: " + load.replace(/\s+/g, " "));
  ok(await page.evaluate(() => window.__DB.group_tasks.length) === 4, tag + " tasks reached the server stub");
  await noOverflow(page, tag + " after adding");
  await page.screenshot({path: path.join(shots, `pt-${w}-1-tasks.png`), fullPage: true});
  // claim
  await page.click('[data-act="grp-pt-claim"]'); await page.waitForTimeout(250);
  ok(/Find three figures.*You/.test(await txt(page, ".pt-tasks li:nth-child(2)")), tag + " claim assigns me: " + (await txt(page, ".pt-tasks")).replace(/\s+/g, " "));
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.title === "Find three figures").assignee_id) === "u1", tag + " claim saved");
  // nudge Jo about the overdue task
  ok(await page.$$eval('[data-act="grp-pt-nudge"]', e => e.length) === 1, tag + " nudge only for someone else's overdue task");
  await page.click('[data-act="grp-pt-nudge"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__calls.some(c => c[0] === "insert" && c[1] === "group_messages" && /Nudge for Jo/.test(c[2].body))), tag + " nudge posted to the board");
  ok(/Nudged/.test(await txt(page, "#grpPT")), tag + " nudge is rate limited per day on screen");
  // complete
  await page.click('.pt-task:has-text("Make the slides") [data-act="grp-pt-done"]'); await page.waitForTimeout(300);
  ok(/1 of 4 done/.test(await txt(page, ".pt-prog")), tag + " completing updates progress");
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.title === "Make the slides").status) === "done", tag + " completion saved");
  ok(await page.getAttribute('.pt-task:has-text("Make the slides") [data-act="grp-pt-done"]', "aria-checked") === "true", tag + " checkbox state is exposed");
  // filters
  const filt = async f => { await page.click(`[data-act="grp-pt-filter"][data-f="${f}"]`); await page.waitForTimeout(100); return page.$$eval(".pt-task .pt-title", e => e.map(x => x.innerText)); };
  eq(await filt("mine"), ["Find three figures"], tag + " Mine");
  eq(await filt("unassigned"), [], tag + " Unassigned (none left)");
  ok(/Every open task has an owner/.test(await txt(page, "#grpPT")), tag + " empty filter message");
  eq(await filt("overdue"), ["Write the abstract"], tag + " Overdue");
  eq(await filt("done"), ["Make the slides"], tag + " Done");
  ok((await filt("all")).length === 4, tag + " All");
  // realtime: Sam finishes his task in another browser
  await page.evaluate(() => { const t = window.__DB.group_tasks.find(x => x.title === "Draft the intro"); t.status = "done"; t.completed_by = "u2"; t.completed_at = new Date().toISOString(); t.updated_by = "u2"; window.__fire("group_tasks", "UPDATE"); });
  await page.waitForTimeout(900);
  ok(/2 of 4 done/.test(await txt(page, ".pt-prog")), tag + " realtime update from another member");
  ok(await page.evaluate(() => window.__chans.some(c => !c.gone && c.name.startsWith("sbt-"))), tag + " the task channel was opened once the tables were confirmed");
  // typing is not lost when a live update arrives
  await page.fill("#ptTitle", "Half typed"); await page.evaluate(() => window.__fire("group_tasks", "UPDATE")); await page.waitForTimeout(900);
  eq(await page.inputValue("#ptTitle"), "Half typed", tag + " live update keeps the draft");
  ok(await page.evaluate(() => document.activeElement && document.activeElement.id) === "ptTitle", tag + " and keeps focus");
  await page.fill("#ptTitle", "");
  // error rollback
  await page.evaluate(() => { window.__fail = "update_group_task"; window.__failMsg = "You don't have permission to do that in this group."; });
  await page.click('.pt-task:has-text("Write the abstract") [data-act="grp-pt-done"]');
  await page.waitForTimeout(10);
  await page.waitForTimeout(300);
  ok(await page.getAttribute('.pt-task:has-text("Write the abstract") [data-act="grp-pt-done"]', "aria-checked") === "false", tag + " failed save rolls the checkbox back");
  ok(/permission/.test(await txt(page, "#toast")), tag + " the error is explained");
  // offline add: the row goes away and the text comes back
  await page.evaluate(() => { window.__offline = true; });
  await page.fill("#ptTitle", "Offline thought"); await page.press("#ptTitle", "Enter"); await page.waitForTimeout(400);
  eq(await page.$$eval(".pt-task", e => e.length), 4, tag + " offline add rolls back");
  eq(await page.inputValue("#ptTitle"), "Offline thought", tag + " offline add restores what was typed");
  ok(/reach Studyboard/.test(await txt(page, "#toast")), tag + " offline message");
  await page.evaluate(() => { window.__offline = false; }); await page.fill("#ptTitle", "");
  // edit sheet
  await page.click('.pt-task:has-text("Write the abstract") [data-act="grp-pt-edit"]'); await page.waitForSelector("dialog[open] input[name=title]");
  await page.fill('dialog input[name="title"]', "Write the abstract (150 words)"); await page.fill('dialog textarea[name="notes"]', "Keep it under 150 words"); await page.selectOption('dialog select[name="priority"]', "high"); await page.selectOption('dialog select[name="who"]', "u1");
  await noOverflow(page, tag + " edit sheet");
  await page.screenshot({path: path.join(shots, `pt-${w}-2-edit.png`)});
  await page.click("dialog [data-submit]"); await page.waitForTimeout(400);
  const saved = await page.evaluate(() => window.__DB.group_tasks.find(t => /abstract/.test(t.title)));
  ok(saved.title === "Write the abstract (150 words)" && saved.notes === "Keep it under 150 words" && saved.priority === "high" && saved.assignee_id === "u1", tag + " edit saved (owner may reassign)");
  ok(/High/.test(await txt(page, "#grpPT")), tag + " priority tag");
  // list options: archive, then restore
  await page.click('[data-act="grp-pt-list-edit"]'); await page.click('dialog [data-act="grp-pt-list-arch"]'); await page.waitForTimeout(300);
  ok(/All your lists are archived/.test(await txt(page, "#grpPT")), tag + " archive hides the list");
  await page.click('[data-act="grp-pt-arch"]'); await page.waitForTimeout(100);
  ok(/archived/.test(await txt(page, ".pt-lists")), tag + " archived lists can be shown");
  await page.click('[data-act="grp-pt-list-edit"]'); await page.click('dialog [data-act="grp-pt-list-arch"]'); await page.waitForTimeout(300);
  ok(await page.$$eval(".pt-task", e => e.length) === 4, tag + " restore brings tasks back");
  await noOverflow(page, tag + " final");
  await page.screenshot({path: path.join(shots, `pt-${w}-3-final.png`), fullPage: true});
  eq(errs, [], tag + " no page errors: " + errs.join(" | "));
  await ctx.close();
}
const eq = (a, b, m) => { checks++; assert.deepStrictEqual(a, b, m); };

async function plainMember(browser){
  const {ctx, page, errs} = await boot(browser, 390, {me: "u2", seed: true});
  await openGroup(page);
  await page.click('.pt-task:has-text("Book printing") [data-act="grp-pt-edit"]'); await page.waitForSelector("dialog[open] select[name=who]");
  ok(await page.$eval('dialog select[name="who"]', e => e.disabled), "a plain member can't reassign someone else's task (select is disabled)");
  ok(/Only Jo or the group owner/.test(await txt(page, "dialog")), "the reason is shown");
  ok(await page.$$eval('dialog [data-act="grp-pt-del"]', e => e.length) === 0, "no delete button for a task someone else added");
  await page.keyboard.press("Escape");
  // an unassigned task can be claimed by anyone
  await page.click('.pt-task:has-text("Proofread") [data-act="grp-pt-claim"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.title === "Proofread").assignee_id) === "u2", "member claims an unassigned task");
  eq(errs, [], "no errors (member)");
  await ctx.close();
}

async function sqlNotRun(browser){
  for (const who of ["u1", "u2"]) {
    const {ctx, page, errs} = await boot(browser, 1280, {me: who, missing: ["group_task_lists", "group_tasks"]});
    await openGroup(page).catch(() => {});
    await page.waitForTimeout(500);
    const t = await txt(page, "#grpPT");
    if (who === "u1") { ok(/groups\.sql/.test(t) && /Project Tasks/.test(t), "owner sees the run groups.sql note: " + t.replace(/\s+/g, " ")); await page.screenshot({path: path.join(shots, "pt-1280-sql-not-run.png")}); }
    else ok(t.trim() === "", "members see nothing when the SQL isn't run");
    ok(await page.evaluate(() => !window.__chans.some(c => c.name.startsWith("sbt-"))), "no task channel is opened while the tables are missing (it would break the others)");
    ok(await page.$("#grpDecks") !== null, "the rest of the group page still works");
    eq(errs, [], "no errors (sql not run)");
    await ctx.close();
  }
}

async function planner(browser, w){
  const tag = "planner " + w;
  const {ctx, page, errs} = await boot(browser, w, {me: "u1", seed: true});
  await page.waitForSelector("#grpMine", {timeout: 6000});
  const card = await txt(page, "#grpMine");
  ok(/Group: BIOL 201 Poster/.test(card), tag + " group badge: " + card.replace(/\s+/g, " "));
  ok(/Write the methods section/.test(card) && /Collect survey data/.test(card) && !/Design the poster layout/.test(card) && !/Proofread/.test(card), tag + " only my tasks");
  ok(/1 group task due this week/.test(card), tag + " Today line: " + card.replace(/\s+/g, " ").slice(0, 160));
  ok(/1 overdue/.test(card), tag + " overdue count");
  ok(/about 1h/.test(card), tag + " default 1h effort");
  ok(await page.evaluate(() => typeof window.SBGROUPTASKS.mine === "function" && window.SBGROUPTASKS.mine().length === 2), tag + " accessor returns two rows");
  ok(await page.evaluate(() => window.SBGROUPTASKS.mine().every(r => r.hours === 1 && /^\d{4}-\d{2}-\d{2}$/.test(r.due))), tag + " rows have dates and hours");
  ok(await page.evaluate(() => !Object.values(JSON.parse(localStorage.getItem("coursework:v2") || "{}").tasks || {}).some(t => /methods section/.test(t.title || ""))), tag + " not copied into the personal task list");
  ok(await page.evaluate(() => (localStorage.getItem("sb:gtmine:u1") || "").includes("Write the methods section")), tag + " cached for offline");
  await page.screenshot({path: path.join(shots, `planner-${w}.png`), fullPage: true});
  await noOverflow(page, tag);
  // complete from the planner updates the shared task
  await page.click('#grpMine [data-act="grp-pt-done"]:near(:text("Collect survey data"))').catch(async () => { await page.click('#grpMine li:has-text("Collect survey data") [data-act="grp-pt-done"]'); });
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s2").status) === "done", tag + " completing here completes the shared task");
  ok(!/Collect survey data/.test(await txt(page, "#grpMine")), tag + " it leaves the card");
  // open the group from the card
  await page.click('#grpMine [data-act="grp-pt-open"]:has-text("Write the methods section")'); await page.waitForSelector("#grpPT", {timeout: 4000}); await page.waitForTimeout(700);
  ok(/BIOL 201 Poster/.test(await txt(page, "#grpPT")), tag + " card opens the group's list");
  // the other way round: finishing it in the group updates the planner
  await page.click('.pt-task:has-text("Write the methods section") [data-act="grp-pt-done"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.SBGROUPTASKS.mine().length === 0), tag + " completing in the group updates the planner list");
  // a failed completion from the planner (group not open) rolls back
  eq(errs, [], tag + " no errors: " + errs.join(" | "));
  await ctx.close();
}

async function plannerRollback(browser){
  const {ctx, page, errs} = await boot(browser, 1280, {me: "u1", seed: true});
  await page.waitForSelector("#grpMine", {timeout: 6000});
  await page.evaluate(() => { window.__fail = "update_group_task"; window.__failMsg = "Couldn't reach Studyboard. Check your internet connection and try again."; });
  await page.click('#grpMine li:has-text("Collect survey data") [data-act="grp-pt-done"]'); await page.waitForTimeout(500);
  ok(/Collect survey data/.test(await txt(page, "#grpMine")), "a failed completion from the planner puts the row back");
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s2").status) === "todo", "and the shared task is untouched");
  eq(errs, [], "no errors (planner rollback)");
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath: exe});
  try {
    await scenario(browser, 1280); await scenario(browser, 390);
    await plainMember(browser); await sqlNotRun(browser);
    await planner(browser, 1280); await planner(browser, 390); await plannerRollback(browser);
    console.log(`grouptasks.e2e.js: ${checks} checks passed. Screenshots in ${shots}`);
  } catch(e) { console.error("FAILED:", e.message); process.exitCode = 1; }
  await browser.close();
})();
