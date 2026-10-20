// Browser checks for Pro groups (index.html, 80-groups 1.16 block): the Pro group box, Team Deadline, Rubric Checklist, Split the Work,
// Review Before Done, Find a Time, Contribution Report, templates, group uploads, weekly sessions, Split Exam Topics and the free-group view.
// Uses an in-memory stand-in for the Supabase client (the same one as tests/grouptasks.e2e.js, with the Pro group calls added).
// Run: node tests/progroups.e2e.js
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(path.join(__dirname, "..", "index.html"));
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); console.log("ok -", m); };

function stubInit(opts){
  const me = {id: opts.me, email: opts.me + "@x.com"};
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  const DB = {
    study_groups: [{id: "g1", name: "Bio Squad", course: "BIOL 201", owner_id: "u1", invite_code: "ABC-DEF", created_at: "2026-01-01", weekly_goal: 0, kind: opts.kind || "study", project_due: opts.kind === "project" ? day(20) : null, team_due: null}],   // task lists now live in study groups that already have one (a group project uses its board, see groupkinds.e2e.js)
    group_members: [{group_id: "g1", user_id: "u1", role: "owner", display_name: "Connor", joined_at: "2026-01-01"}, {group_id: "g1", user_id: "u2", role: "member", display_name: "Sam", joined_at: "2026-01-02"}, {group_id: "g1", user_id: "u3", role: "member", display_name: "Jo", joined_at: "2026-01-03"}],
    group_items: [], group_messages: [], study_profiles: [{user_id: opts.me, display_name: opts.me === "u1" ? "Connor" : "Sam"}], shared_decks: [], group_blocks: [],
    group_quiz_scores: [], group_rsvps: [], group_stats: [], group_checkins: [], group_reactions: [],
    group_task_lists: [], group_tasks: []
  };
  const nowIso = () => new Date().toISOString(); let n = 0; const id = p => p + (++n);
  // more groups of mine (g2...), and the ones I've assigned Pro to
  for (let i = 2; i <= (opts.groups || 1); i++) { DB.study_groups.push({id: "g" + i, name: "Group " + i, course: "", owner_id: "u1", invite_code: "G" + i, created_at: "2026-01-0" + Math.min(9, i), weekly_goal: 0, kind: "study", project_due: null, team_due: null}); DB.group_members.push({group_id: "g" + i, user_id: "u1", role: "owner", display_name: "Connor", joined_at: "2026-01-01"}); }
  const ASSIGNED = new Set(opts.assigned || []);
  // lists can't be made any more: a study group shows the ones it already has (an empty one here, for the main scenario)
  if (opts.emptyList) DB.group_task_lists.push({id: "L1", group_id: "g1", title: "BIOL 201 Poster", course_code: "BIOL 201", created_by: "u1", created_at: "2026-02-01T00:00:00Z", archived: false});
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
      if (st.op === "insert") { const add = [].concat(st.payload).map(r => Object.assign({id: id("r"), user_id: me.id, created_at: nowIso(), updated_at: nowIso()}, r)); add.forEach(r => rows.push(r)); window.__calls.push(["insert", t, st.payload]); return wait({data: st.one ? add[0] : add}); }
      if (st.op === "update") { hit.forEach(r => Object.assign(r, st.payload)); return wait({data: st.one ? hit[0] : hit}); }
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); return wait({data: null}); }
      let out = hit.slice(); if (st.order) out.sort((a, b) => (String(a[st.order[0]]) > String(b[st.order[0]]) ? 1 : -1) * (st.order[1] ? 1 : -1));
      if (st.one) return wait({data: out[0] || null});
      return wait({data: out});
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      gte(c, v) { st.f.push(r => r[c] >= v); return api; },
      // PostgREST's or=(col.op.value,...), as the planner asks for "not done, or finished in the last two weeks"
      or(expr) { const ts = String(expr).split(",").map(x => { const i = x.indexOf("."), j = x.indexOf(".", i + 1); return [x.slice(0, i), x.slice(i + 1, j), x.slice(j + 1)]; });
        const t1 = ([c, op, v], r) => op === "eq" ? String(r[c]) === v : op === "neq" ? String(r[c]) !== v : op === "gte" ? String(r[c] || "") >= v : op === "is" ? (v === "null" ? r[c] == null : String(r[c]) === v) : false;
        st.f.push(r => ts.some(t => t1(t, r))); return api; },
      order(c, o) { st.order = [c, !(o && o.ascending === false)]; return api; }, limit() { return api; },
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
    group_pro_status(a) { return {data: (a.p_groups || []).map(g => ASSIGNED.has(g) ? {group_id: g, active: true, by_user: me.id, by_owner: ownerOf(g)} : {group_id: g, active: !!opts.pro, by_user: opts.pro ? "u2" : null, by_owner: false})}; },
    group_pro_set(a) { if (a.p_on && ASSIGNED.size >= 5) return E("SB_PRO_GROUPS_FULL: You've assigned Pro to 5 groups. Unassign one first."); if (a.p_on) ASSIGNED.add(a.p_group); else ASSIGNED.delete(a.p_group); return {data: a.p_on ? "on" : "off"}; },
    set_supporter_badge(a) { DB.group_members.filter(m => m.user_id === me.id).forEach(m => { m.badge = !!a.p_on; }); return {data: !!a.p_on}; },
    update_group_task(a) { const t = DB.group_tasks.find(x => x.id === a.p_task && !x.deleted); if (!t) return E("That task isn't in one of your groups"); const p = Object.assign({}, a.p_patch);
      const rev = "reviewer_id" in p ? p.reviewer_id : t.reviewer_id; if (p.status === "done" && t.status !== "done" && rev && rev !== me.id && !ownerOf(t.group_id)) p.status = "review";
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
    storage: {from: () => ({upload: (p, f) => { window.__uploads = (window.__uploads || []).concat(p); return wait({data: {path: p}, error: null}); }, download: () => wait({data: new Blob(["x"]), error: null}), remove: () => wait({data: null, error: null})})},
    channel: name => { const c = {name, h: [], on(type, cfg, cb) { c.h.push({cfg, cb}); return c; }, subscribe() { return c; }}; window.__chans.push(c); return c; },
    removeChannel(c) { c.gone = true; }
  };
  window.__sbGroupsStub = {user: me, client};
  try { localStorage.setItem("sb:grpName:" + me.id, me.id === "u1" ? "Connor" : "Sam"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); } catch(e) {}
  window.__fire = (table, ev) => { window.__chans.filter(c => !c.gone).forEach(c => c.h.forEach(h => { if (h.cfg.table === table) h.cb({eventType: ev || "UPDATE", new: {}, old: {}}); })); };
}

async function boot(browser, opts){
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, opts);
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d && d.open) d.close(); });
  return {ctx, page, errs};
}
const click = (page, act, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; document.body.appendChild(b); b.click(); b.remove(); }, [act, id || ""]);
async function openGroup(page){
  await click(page, "grp-page"); await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]');
  await page.waitForSelector("#grpDetail", {timeout: 5000}); await page.waitForTimeout(900);
}
const SHOT = async (page, name) => { if (process.env.SHOTS) await page.screenshot({path: path.join(process.env.SHOTS, name + ".png")}); };
const tab = async (page, t) => { await page.click(`[data-act="grp-tab"][data-t="${t}"]`); await page.waitForTimeout(250); };
const txt = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ") : ""; }, sel);
const DB = (page, f) => page.evaluate(f);

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // ---------- A group project made Pro by a member (I'm the owner, on the free plan) ----------
    let {page, errs} = await boot(browser, {me: "u1", kind: "project", pro: true, seed: true});
    await openGroup(page);
    ok(await page.locator("#grpHead .gx-chip").count() === 1, "the header says PRO GROUP");
    // A header redrawn on its own (live updates) tucks Assign Pro behind More before the screen paints: it never flickers into view
    ok(await page.evaluate(async () => { const band = document.createElement("div"); band.className = "g2-band"; band.innerHTML = '<div class="row-actions"><button class="btn primary">Invite</button><button class="btn gx-assign">Assign Pro</button></div>';
      document.getElementById("view").appendChild(band); await Promise.resolve(); const out = !band.querySelector(".row-actions > .gx-assign") && !!band.querySelector(".ra-menu .gx-assign"); band.remove(); return out; }), "Assign Pro is behind More as soon as a header is drawn");
    await tab(page, "members");
    ok(/Pro thanks to Sam/.test(await txt(page, "#gxPro")), "Members says who made it a Pro group");
    await SHOT(page, "g1-members");
    await tab(page, "overview");
    ok(await page.locator("#gxOver .gx-card").count() === 1 && await page.locator('#gxOver [data-act="gx-team-set"]').count() === 1, "Overview offers the owner a team deadline");
    await page.click('#gxOver [data-act="gx-team-set"]'); await page.waitForTimeout(300);
    await page.click("#dlg [data-submit]"); await page.waitForTimeout(400);
    const td = await DB(page, () => window.__DB.study_groups[0].team_due);
    ok(/^\d{4}-\d{2}-\d{2}$/.test(td || ""), "the team deadline is saved on the group: " + td);
    ok(/days left|Tomorrow|Today/.test(await txt(page, "#gxOver")), "Overview counts down to the team deadline");
    await SHOT(page, "g2-overview");

    // Rubric Checklist
    await tab(page, "tasks");
    await page.click('#gxTasks [data-act="gx-rubric"]'); await page.waitForTimeout(300);
    await page.fill("#dlg [data-rb-text]", "Final report rubric\n- Introduction states the problem (10 points)\n- At least five peer-reviewed sources\n2. Slides are 10 minutes or less\nGood luck!");
    await page.waitForTimeout(200);
    ok(await page.locator("#dlg [data-rb-i]").count() === 3, "three requirements are found in the pasted rubric");
    await page.click("#gxRbGo"); await page.waitForTimeout(900);
    const rb = await DB(page, () => window.__DB.group_tasks.filter(t => /^Check: /.test(t.title)).map(t => t.title + "|" + t.due_at));
    ok(rb.length === 3 && rb.every(x => x.endsWith("|" + td)), "each requirement is a task, due at the team deadline: " + JSON.stringify(rb));
    ok(await DB(page, () => window.__DB.group_task_lists.some(l => l.title === "Rubric")), "they go in a Rubric list");

    // Split the Work
    const unassigned = await DB(page, () => window.__DB.group_tasks.filter(t => !t.assignee_id && t.status !== "done" && !t.deleted).length);
    await page.click('#gxTasks [data-act="gx-split"]'); await page.waitForTimeout(300);
    ok(await page.locator("#dlg .gx-split").count() === 3, "Split the Work shows each member's share");
    await SHOT(page, "g5-split");
    await page.click('#dlg [data-act="gx-split-go"]'); await page.waitForTimeout(1500);
    ok(await DB(page, () => window.__DB.group_tasks.filter(t => !t.assignee_id && t.status !== "done" && !t.deleted).length) === 0 && unassigned > 0, `every unassigned task (${unassigned}) has someone now`);
    ok(await DB(page, () => window.__DB.group_messages.some(m => /Split the Work/.test(m.body))), "the group is told in chat");

    // Review Before Done: a reviewer on a task; marking it done as someone else sends it to review (server rule), the owner sees Approve
    const tid = await DB(page, () => window.__DB.group_tasks.find(t => t.assignee_id === "u2" && t.status !== "done").id);
    await DB(page, () => {}); await page.evaluate(id => { const t = window.__DB.group_tasks.find(x => x.id === id); t.status = "review"; t.reviewer_id = "u1"; }, tid);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "grp-pt-retry"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(800);
    ok(await page.locator(`.kb-card[data-id="${tid}"] [data-act="gx-rv-ok"]`).count() === 1, "a task in review shows Approve to its reviewer");
    await page.click(`.kb-card[data-id="${tid}"] [data-act="gx-rv-ok"]`); await page.waitForTimeout(500);
    ok(await DB(page, () => window.__DB.group_tasks.find(t => t.status === "review") == null), "Approve marks it done");
    await page.click(`[data-act="grp-pt-edit"][data-id="${tid}"]`).catch(() => {}); await page.waitForTimeout(300);
    ok(await page.locator('#dlg select[name="reviewer"]').count() === 1, "the task sheet has a Reviewer choice");
    await page.selectOption('#dlg select[name="reviewer"]', "u3"); await page.click("#dlg [data-submit]"); await page.waitForTimeout(500);
    ok(await DB(page, () => window.__calls.some(c => c[1] === "update_group_task" && c[2].p_patch.reviewer_id === "u3")), "choosing a reviewer is saved");

    // Find a Time: share my free times, see the best times, add one to Meetings
    await tab(page, "meetings");
    await page.click('#gxFind [data-act="gx-ft"]'); await page.waitForTimeout(300);
    // the default is picking your own free hours (one tap per hour); Fill In Automatically is the other way
    ok(await page.locator('#dlg [data-act="gx-ft-mine"]').count() === 1 && await page.locator('#dlg [data-act="gx-ft-add"]').count() === 0, "Find a Time asks you to pick your free times first, and can't add a meeting yet");
    await page.click('#dlg [data-act="gx-ft-mine"]'); await page.waitForSelector("#dlg #pfGrid");
    ok(await page.locator("#dlg #pfGrid [data-pf]").count() === 98, "the picker goes hour by hour, 8 AM to 10 PM, for 7 days");
    await page.click("#dlg #pfAuto"); await page.waitForTimeout(150);
    ok(await page.locator('#dlg #pfGrid [aria-pressed="true"]').count() > 10, "Fill In Automatically marks the hours the planner has free");
    await SHOT(page, "g3-pickfree");
    await page.click("#dlg #pfClear");
    for (const k of ["2:10", "2:11", "2:12", "3:16"]) await page.click(`#dlg #pfGrid [data-pf="${k}"]`);
    await page.click("#dlg #pfSave"); await page.waitForTimeout(700);
    const av = await DB(page, () => window.__DB.group_items.find(i => i.kind === "avail"));
    ok(av && av.data.hex.length === 168 && av.data.from > 0, "my picked hours are shared as free and busy half-hours (14 days, nothing else)");
    ok(await page.evaluate(() => Object.keys(localStorage).some(k => /availShare/.test(k) && localStorage.getItem(k) === "manual")), "picked by hand, so the app won't overwrite it");
    ok(/at least 2 members/.test(await page.textContent("#dlg")) && await page.locator('#dlg [data-act="gx-ft-add"]').count() === 0, "with only me shared, no session can be added yet");
    await DB(page, () => { const me = window.__DB.group_items.find(i => i.kind === "avail"); window.__DB.group_items.push({id: "av-u2", group_id: me.group_id, user_id: "u2", author_name: "Sam", kind: "avail", ref_id: "", title: "free", data: {v: 1, from: me.data.from, hex: "0".repeat(168)}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()}); });
    await page.keyboard.press("Escape"); await page.evaluate(() => window.__fire("group_items", "INSERT")); await page.waitForTimeout(1200); await page.click('#gxFind [data-act="gx-ft"]'); await page.waitForTimeout(400);
    await SHOT(page, "g3-findtime");
    ok(await page.locator("#dlg .ft-grid .ft-c").count() === 98 && await page.locator('#dlg [data-act="gx-ft-pick"]').count() >= 1, "with 2 shared, Find a Time shows the week hour by hour and the best times");
    await page.click('#dlg [data-act="gx-ft-add"]'); await page.waitForTimeout(700);
    ok(await DB(page, () => window.__DB.group_items.some(i => i.kind === "event" && /Find a Time/.test(i.data.notes))), "the picked time is added to Meetings");

    // Weekly meetings
    await page.click('[data-act="grp-event-new"]'); await page.waitForTimeout(300);
    ok(await page.locator('#dlg input[name="weekly"]').count() === 1, "a meeting can repeat every week");
    await page.fill('#dlg input[name="title"]', "Standup"); await page.check('#dlg input[name="weekly"]');
    await page.click("#grpEvGo"); await page.waitForTimeout(800);
    ok(await DB(page, () => window.__DB.group_items.some(i => i.title === "Standup" && i.data.repeat && i.data.repeat.weekly)), "the weekly meeting is saved");
    ok(/Every week/.test(await txt(page, "#grpSessions")), "the meeting list says Every week");

    // Group uploads
    await tab(page, "files");
    ok(await page.locator("#gxUploads").count() === 1, "Files has Group Uploads");
    await page.setInputFiles('#gxUploads input[type="file"]', {name: "draft.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test")}); await page.waitForTimeout(800);
    ok(await DB(page, () => (window.__uploads || []).some(p => /^u1\/g\/g1\/.+-draft\.pdf$/.test(p)) && window.__DB.group_items.some(i => i.kind === "gfile" && i.title === "draft.pdf")), "an upload goes to my own folder for this group and is listed");

    // Contribution Report and templates
    await tab(page, "overview");
    await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await page.click('#gxOver [data-act="gx-report"]'); await page.waitForTimeout(500);
    ok(await page.evaluate(() => window.__printed) === 0 && await page.locator("#dlg .gx-rep-sheet .pr-prev .pp-gc tbody tr").count() === 3, "the contribution report opens as a preview first, a row per member");
    ok(await page.locator("#dlg #gxRepSave").count() === 1 && await page.locator("#dlg #gxRepPrint").count() === 1, "with Download PDF and Print");
    await SHOT(page, "g3-report-preview");
    await page.click("#dlg #gxRepPrint"); await page.waitForTimeout(500);
    ok(await page.evaluate(() => window.__printed) === 1 && await page.locator("#sbPrint .pp-gc tbody tr").count() === 3, "Print prints the report");
    // the desktop app makes a PDF instead of the system print dialog (no preview there): Print opens it, Download asks where to save
    await page.evaluate(() => { window.__pdf = []; window.studiosoDesktop = Object.assign(window.studiosoDesktop || {}, {printPdf: async o => { window.__pdf.push([o, document.body.classList.contains("sb-printing"), !!document.querySelector("#sbPrint .pp-gc")]); return o.mode === "save" ? {ok: true, saved: true, name: "r.pdf"} : {ok: true, opened: true}; }, openSavedPdf: async () => true}); document.body.classList.remove("sb-printing"); });
    await page.click('#gxOver [data-act="gx-report"]'); await page.waitForTimeout(300); await page.click("#dlg #gxRepSave"); await page.waitForTimeout(400);
    const pdf = await page.evaluate(() => window.__pdf);
    ok(pdf.length === 1 && pdf[0][0].mode === "save" && /Contribution Report/.test(pdf[0][0].name) && pdf[0][1] && pdf[0][2] && await page.evaluate(() => window.__printed) === 1, "in the desktop app Download PDF saves a PDF of the print view (no system print dialog)");
    ok(await page.evaluate(() => !document.body.classList.contains("sb-printing")), "and the page goes back to normal");
    await page.evaluate(() => document.body.classList.remove("sb-printing"));
    await page.click('#gxOver [data-act="gx-tpl-save"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => (JSON.parse(localStorage.getItem("coursework:v2") || "{}").settings || {}).grpTemplates.length === 1), "the project is saved as a template in my settings");
    ok(!errs.length, "no errors in the project: " + errs.join(" | "));
    await page.context().close();

    // ---------- A study group made Pro: Split Exam Topics ----------
    ({page, errs} = await boot(browser, {me: "u1", kind: "study", pro: true}));
    await openGroup(page);
    ok(await page.locator("#gxTopics").count() === 1, "a Pro study group has Split Exam Topics on its Study tab");
    await page.click('#gxTopics [data-act="gx-tp-new"]'); await page.waitForTimeout(300);
    await page.fill('#dlg input[name="exam"]', "Midterm"); await page.fill('#dlg textarea[name="topics"]', "Cells\nGenes\nEnzymes\nMembranes");
    await page.click("#gxTpGo"); await page.waitForTimeout(800);
    const tp = await DB(page, () => window.__DB.group_items.find(i => i.kind === "topics"));
    ok(tp && tp.data.topics.length === 4 && new Set(tp.data.topics.map(t => t.who)).size === 3, "four topics are shared out between the three members");
    ok(await page.locator("#gxTopics .gx-mine").count() === 1, "I see my own topic");
    await page.evaluate(() => { const l = document.querySelector("#gxTopics .gx-tlist"); if (l) l.scrollIntoView({block: "center"}); }); await SHOT(page, "g4-topics-list");
    ok(await page.evaluate(() => [...document.querySelectorAll("#gxTopics .gx-tlist li")].filter(li => li.classList.contains("mc-row")).every(li => getComputedStyle(li).borderLeftWidth === "4px")), "each person's topic has the curved edge in their colour");
    await SHOT(page, "g4-topics");
    await page.click('#gxTopics [data-act="gx-tp-done"]'); await page.waitForTimeout(600);
    ok(await DB(page, () => window.__DB.group_items.some(i => i.kind === "topic" && i.data.done)), "marking my topic shared is saved");
    await tab(page, "sessions");
    ok(await page.locator("#gxLive").count() === 1 && await page.locator('#gxFind [data-act="gx-ft"]').count() === 1, "Sessions has Find a Time and the Live Quiz");
    // Any color (Pro groups): a picker and a code box, with a check against everyone else's color
    await DB(page, () => { window.__DB.group_members.forEach(m => { if (m.user_id === "u2") m.color = "#E5484D"; }); });
    await click(page, "grp-color", await DB(page, () => window.__DB.study_groups[0].id)); await page.waitForSelector("#dlg[open] #mcAny");
    ok(await page.locator("#dlg[open] .mc-any .pro-badge").count() === 1, "Any Color shows with a PRO badge");
    await page.fill("#mcHex", "#E8504F"); await page.waitForTimeout(100);
    ok(await page.isDisabled("#mcUse") && /Too close to/.test(await txt(page, "#mcMsg")), "a shade very close to someone's color can't be used: " + await txt(page, "#mcMsg"));
    ok(await page.isDisabled('#dlg[open] [data-mc="#E5484D"]'), "their palette color is taken");
    await page.fill("#mcHex", "7fffd4"); await page.waitForTimeout(100);
    ok(!(await page.isDisabled("#mcUse")) && (await page.inputValue("#mcAny")) === "#7fffd4", "a code without # works and moves the picker");
    ok(await page.evaluate(() => getComputedStyle(document.querySelector("#mcPrev")).color) === "rgb(31, 36, 48)", "initials turn dark on a light color");
    await SHOT(page, "g4-any-color");
    await page.click("#mcUse"); await page.waitForTimeout(500);
    ok(await DB(page, () => window.__calls.some(c => c[1] === "set_member_color" && c[2].p_color === "#7FFFD4")), "Use This Color saves it");
    ok(!errs.length, "no errors in the study group: " + errs.join(" | "));
    await page.context().close();

    // ---------- A free group (nobody made it Pro) ----------
    ({page, errs} = await boot(browser, {me: "u1", kind: "project", pro: false, seed: true}));
    await openGroup(page);
    await click(page, "grp-color", await DB(page, () => window.__DB.study_groups[0].id)); await page.waitForSelector("#dlg[open] .mc-grid");
    ok(await page.locator("#dlg[open] .mc-any.is-locked .pro-badge").count() === 1 && await page.locator("#dlg[open] #mcAny").count() === 0, "a free group shows Any Color locked, with the PRO badge");
    await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); }); await page.waitForTimeout(200);
    ok(await page.locator("#grpHead .gx-chip").count() === 0 && await page.locator("#gxOver").count() === 0 && await page.locator("#gxTasks").count() === 0, "a free group has no Pro extras");
    await tab(page, "members");
    ok(/A member with Studyboard Pro can make this a Pro group/.test(await txt(page, "#gxPro")), "Members explains Pro groups, once");
    ok(await page.locator("#grpHead .gx-assign").count() === 0, "without Pro there's no Assign Pro button");
    ok(!errs.length, "no errors in the free group: " + errs.join(" | "));
    console.log(`\nprogroups.e2e: ${checks} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
