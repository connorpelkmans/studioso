// A group project's task board on a phone: To Do / In Progress / Done sit side by side and scroll sideways with snapping, like the main Task Board
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} (${a} vs ${b})`);

// A stub Supabase with one group project and its tasks (trimmed from groupkinds.e2e.js)
function stubInit(){
  const me = {id: "u1", email: "u1@x.com"}, now = new Date().toISOString();
  const mem = (u, role, name) => ({group_id: "g2", user_id: u, role, display_name: name, joined_at: "2026-01-0" + u.slice(1)});
  const T = (i, title, status, who) => ({id: "T" + i, list_id: "L1", group_id: "g2", title, notes: "", status, assignee_id: who, due_at: null, priority: null, position: i, created_by: "u1", created_at: now, updated_by: "u1", updated_at: now, completed_at: null, completed_by: null, deleted: false});
  const DB = {
    study_groups: [{id: "g2", name: "Poster Team", course: "BIOL 201", owner_id: "u1", invite_code: "XYZ-123", created_at: "2026-01-02", weekly_goal: 0, kind: "project", project_due: "2099-01-01"}],
    group_members: [mem("u1", "owner", "Connor"), mem("u2", "member", "Sam"), mem("u3", "member", "Jo")],
    group_items: [], group_messages: [], study_profiles: [{user_id: "u1", display_name: "Connor"}], shared_decks: [], group_blocks: [], group_quiz_scores: [], group_misses: [], group_rsvps: [],
    group_stats: [], group_checkins: [], group_reactions: [], group_peer_ratings: [],
    group_task_lists: [{id: "L1", group_id: "g2", title: "Tasks", course_code: "", created_by: "u1", created_at: now, archived: false}],
    group_tasks: [T(0, "Research and collect sources", "todo", null), T(1, "Outline it and split the sections", "todo", null), T(2, "Write a first draft", "todo", "u2"),
      T(3, "Draft discussion", "doing", "u1"), T(4, "Agree on the topic", "done", "u3")]
  };
  window.__DB = DB;
  const wait = v => new Promise(r => setTimeout(() => r(v), 15));
  const mk = t => {
    const st = {f: [], op: "select", payload: null, one: false};
    const run = () => {
      const rows = DB[t] || [], hit = rows.filter(r => st.f.every(f => f(r)));
      if (st.op === "insert") { const add = [].concat(st.payload).map(r => Object.assign({id: "r" + Math.random(), created_at: now, updated_at: now, user_id: me.id}, r)); add.forEach(r => rows.push(r)); return wait({data: st.one ? add[0] : add}); }
      if (st.op === "update") { hit.forEach(r => Object.assign(r, st.payload)); return wait({data: st.one ? hit[0] : hit}); }
      if (st.op === "delete") { DB[t] = rows.filter(r => !hit.includes(r)); return wait({data: null}); }
      return wait({data: st.one ? hit[0] || null : hit.slice()});
    };
    const api = {select() { return api; }, eq(c, v) { st.f.push(r => r[c] === v); return api; }, neq(c, v) { st.f.push(r => r[c] !== v); return api; }, in(c, v) { st.f.push(r => v.includes(r[c])); return api; },
      gte(c, v) { st.f.push(r => r[c] >= v); return api; }, order() { return api; }, limit() { return api; }, maybeSingle() { st.one = true; return run(); }, single() { st.one = true; return run(); },
      insert(r) { st.op = "insert"; st.payload = r; return api; }, update(p) { st.op = "update"; st.payload = p; return api; }, delete() { st.op = "delete"; return api; }, upsert(r) { st.op = "insert"; st.payload = r; return api; },
      then(res, rej) { return run().then(res, rej); }};
    return api;
  };
  const rpc = {
    group_pro_status: a => ({data: (a.p_groups || []).map(g => ({group_id: g, active: true, by_user: "u1", by_owner: true}))}),
    update_group_task: a => { const t = DB.group_tasks.find(x => x.id === a.p_task); Object.assign(t, a.p_patch, {updated_at: new Date().toISOString()}); return {data: t}; }
  };
  const client = {from: mk, rpc: (n, a) => wait(rpc[n] ? rpc[n](a) : {data: null}),
    channel: name => { const c = {name, on() { return c; }, subscribe() { return c; }}; return c; }, removeChannel() {}};
  window.__sbGroupsStub = {user: me, client};
  try { localStorage.setItem("sb:grpName:u1", "Connor"); } catch(e) {}
}
const D = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const TASK = (id, title, status) => ({id, title, courseId: "c1", type: "Assignment", start: D(-3), due: D(2), time: "", priority: "med", status, notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10});
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, notes: [], decks: [],
  tasks: [TASK("a1", "Lab report", "todo"), TASK("a2", "Read chapter 6", "doing"), TASK("a3", "Essay outline", "done")]};
const seed = data => { try { localStorage.setItem("coursework:v2", JSON.stringify(data)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studyboard:bview", "board"); } catch(e) {} };

async function boot(browser, w, dark){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}, colorScheme: dark ? "dark" : "light"});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.addInitScript(stubInit); await page.addInitScript(seed, SEED);
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  return {ctx, page, errs};
}
async function openTasks(page){
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "grp-page"; document.body.appendChild(b); b.click(); b.remove(); });
  await page.click('[data-act="grp-open"][data-id="g2"]'); await page.waitForSelector("#grpDetail"); await page.waitForTimeout(700);
  await page.click('[data-act="grp-tab"][data-t="tasks"]'); await page.waitForSelector("#grpPT .kb-col"); await page.waitForTimeout(300);
  await page.evaluate(() => { const k = document.querySelector("#grpPT .kb"); window.scrollBy(0, k.getBoundingClientRect().top - 160); }); await page.waitForTimeout(200);
}
const layout = (page, strip, col) => page.evaluate(([strip, col]) => {
  const b = document.querySelector(strip), s = getComputedStyle(b), cs = [...b.querySelectorAll(col)];
  const inner = b.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
  return {cols: cs.map(c => { const r = c.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height, head: (c.querySelector("h4,.col-head") || {}).innerText}; }),
    ratio: cs[0].getBoundingClientRect().width / inner, gap: s.columnGap, ox: s.overflowX, snap: s.scrollSnapType, align: getComputedStyle(cs[0]).scrollSnapAlign,
    scrolls: b.scrollWidth > b.clientWidth + 20, left: b.getBoundingClientRect().left, right: b.getBoundingClientRect().right, pageW: document.documentElement.scrollWidth};
}, [strip, col]);

async function phone(browser, dark){
  const tag = "390px" + (dark ? " dark" : "");
  // the main Task Board, for reference
  let {ctx, page, errs} = await boot(browser, 390, dark);
  await page.evaluate(() => document.querySelector('nav.tabs [data-tab="board"]').click()); await page.waitForSelector("#board .col");
  const main = await layout(page, "#board", ":scope > .col"); await ctx.close();
  ({ctx, page, errs} = await boot(browser, 390, dark));
  await openTasks(page);
  const g = await layout(page, "#grpPT .kb", ":scope > .kb-col");
  await page.screenshot({path: path.join(shots, `group-tasks-columns-${dark ? "dark" : "light"}.png`)});
  ok(g.cols.length === 3, tag + " three columns");
  ok(/^To Do\s*3$/.test(g.cols[0].head) && /^In Progress\s*1$/.test(g.cols[1].head) && /^Done\s*1$/.test(g.cols[2].head), tag + " headers with counts: " + g.cols.map(c => c.head).join(" | "));
  ok(g.cols.every(c => Math.abs(c.y - g.cols[0].y) < 1), tag + " the columns share one top edge (side by side, not stacked): " + g.cols.map(c => c.y).join(", "));
  ok(g.cols[0].x < g.cols[1].x && g.cols[1].x < g.cols[2].x, tag + " each column sits to the right of the one before: " + g.cols.map(c => c.x).join(", "));
  ok(g.cols[1].x - g.cols[0].x - g.cols[0].w > 0, tag + " columns don't overlap");
  ok(g.ox === "auto" && g.scrolls, tag + " the strip scrolls sideways");
  ok(g.snap === main.snap && g.align === main.align, tag + ` snaps like the main board (${g.snap} / ${g.align})`);
  ok(g.gap === main.gap, tag + ` same gap as the main board (${g.gap})`);
  near(g.ratio, main.ratio, 0.01, tag + " columns take the same share of the strip as the main board's");
  ok(g.cols[1].x < 390, tag + " the next column peeks in from the right");
  ok(g.pageW <= 391, tag + " the page itself doesn't scroll sideways");
  // swiping over snaps a column into place
  const kbx = await page.evaluate(() => { const k = document.querySelector("#grpPT .kb"); k.scrollBy({left: 200}); return new Promise(r => setTimeout(() => r(k.scrollLeft), 600)); });
  const at = await page.evaluate(() => document.querySelector("#grpPT .kb-col.k-doing").getBoundingClientRect().left);
  ok(kbx > 0 && Math.abs(at - g.cols[0].x) < 2, tag + ` scrolling snaps In Progress to where To Do was (${at})`);
  ok(!errs.length, tag + " no page errors: " + errs.join(" | "));
  await ctx.close();
}

// Dragging a card to the edge pages the board over, and the drop keeps it there
async function phoneDrag(browser){
  const tag = "390px drag", {ctx, page, errs} = await boot(browser, 390, false);
  await openTasks(page);
  const card = await page.locator('#grpPT .kb-card[data-id="T0"]').boundingBox();
  await page.mouse.move(card.x + 40, card.y + 20); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(card.x + 40 + (375 - card.x - 40) * i / 10, card.y + 20);
  await page.waitForTimeout(700);
  const sl = await page.evaluate(() => document.querySelector("#grpPT .kb").scrollLeft);
  ok(sl > 100, tag + " holding a card at the right edge pages the board over: " + sl);
  await page.mouse.move(150, card.y + 20); await page.waitForTimeout(200); await page.mouse.up(); await page.waitForTimeout(800);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "T0").status) === "doing", tag + " dropped on In Progress");
  const after = await page.evaluate(() => ({sl: document.querySelector("#grpPT .kb").scrollLeft, in: !!document.querySelector('#grpPT .kb-col.k-doing .kb-card[data-id="T0"]')}));
  ok(after.in && after.sl > 100, tag + " the redrawn board stays on the column it was dropped in: " + after.sl);
  ok(!errs.length, tag + " no page errors: " + errs.join(" | "));
  await ctx.close();
}

// Desktop keeps its three-column grid
async function desktop(browser){
  const {ctx, page} = await boot(browser, 1280, false);
  await openTasks(page);
  const g = await layout(page, "#grpPT .kb", ":scope > .kb-col");
  ok(await page.evaluate(() => getComputedStyle(document.querySelector("#grpPT .kb")).display) === "grid", "1280px still a grid");
  ok(!g.scrolls && g.cols.every(c => Math.abs(c.y - g.cols[0].y) < 1) && g.cols[2].x + g.cols[2].w <= g.right + 1, "1280px all three columns fit side by side without scrolling");
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try { await phone(browser, false); await phone(browser, true); await phoneDrag(browser); await desktop(browser); }
  finally { await browser.close(); }
  console.log(`group-tasks-columns.e2e.js: ${checks} checks passed. Screenshots in ${shots}`);
})().catch(e => { console.error("FAILED:", e.message.split("\n")[0]); process.exit(1); });
